const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://cht-2.onrender.com",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: "https://cht-2.onrender.com",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const JWT_SECRET = "rahasia123";
let users = [];
let contacts = [];
let contactRequests = [];
let stories = [];

// Middleware Auth
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ========== ROUTES ==========
app.post('/api/auth/register', (req, res) => {
    const { username, password, displayName } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username sudah dipakai' });
    }
    const newUser = {
        id: users.length + 1,
        username,
        password,
        displayName: displayName || username,
    };
    users.push(newUser);
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: newUser.id, username: newUser.username, displayName: newUser.displayName } });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Login gagal' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, displayName: user.displayName } });
});

app.get('/api/auth/me', auth, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    res.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
});

app.get('/api/stories', auth, (req, res) => {
    res.json(stories.filter(s => s.userId === req.userId || true)); // semua story
});

app.get('/api/contacts', auth, (req, res) => {
    const myContacts = contacts.filter(c => c.userId === req.userId);
    const contactUsers = myContacts.map(c => users.find(u => u.id === c.contactId)).filter(Boolean);
    res.json(contactUsers);
});

app.get('/api/contacts/requests', auth, (req, res) => {
    const incoming = contactRequests.filter(r => r.toUserId === req.userId && r.status === 'pending');
    res.json(incoming);
});

app.post('/api/contacts/request', auth, (req, res) => {
    const { username } = req.body;
    const target = users.find(u => u.username === username);
    if (!target) return res.status(404).json({ error: 'User tidak ditemukan' });
    if (target.id === req.userId) return res.status(400).json({ error: 'Tidak bisa request sendiri' });
    contactRequests.push({
        id: contactRequests.length + 1,
        fromUserId: req.userId,
        toUserId: target.id,
        status: 'pending',
        createdAt: new Date()
    });
    res.json({ success: true });
});

app.put('/api/contacts/request/:id', auth, (req, res) => {
    const reqId = parseInt(req.params.id);
    const reqData = contactRequests.find(r => r.id === reqId);
    if (!reqData) return res.status(404).json({ error: 'Not found' });
    if (reqData.toUserId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    reqData.status = req.body.status;
    if (req.body.status === 'accepted') {
        contacts.push({ userId: reqData.fromUserId, contactId: reqData.toUserId });
        contacts.push({ userId: reqData.toUserId, contactId: reqData.fromUserId });
    }
    res.json({ success: true });
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('register', (userId) => {
        socket.join(`user:${userId}`);
    });
    socket.on('send_message', (data) => {
        io.to(`user:${data.toUserId}`).emit('new_message', data);
    });
});

const PORT = process.env.PORT || 1000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
