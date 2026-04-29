const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://cht-2.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_secret_ganti_nanti';
const PORT = process.env.PORT || 1000;

// Middleware CORS
app.use(cors({
  origin: 'https://cht-2.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

// ✅ MIDDLEWARE UNTUK CEGAH ERROR .map()
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (data === undefined || data === null) {
      return originalJson.call(this, []);
    }
    return originalJson.call(this, data);
  };
  next();
});

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};

// Data dummy
const users = [
  { id: 1, username: 'admin', password: '123456', displayName: 'Admin', createdAt: new Date() }
];
const contacts = [];
const contactRequests = [];
const stories = [];

// Routes (sama seperti sebelumnya...)
app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }
  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.status(400).json({ error: 'Username sudah digunakan' });
  }
  const newUser = {
    id: users.length + 1,
    username,
    password,
    displayName: displayName || username,
    createdAt: new Date()
  };
  users.push(newUser);
  const token = jwt.sign(
    { userId: newUser.id, username: newUser.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ success: true, message: 'Register berhasil', user: userWithoutPassword, token });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, message: 'Login berhasil', user: userWithoutPassword, token });
});

app.get('/api/auth/me', verifyToken, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  const { password, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

// ✅ ENDPOINT YANG SUDAH DIPERBAIKI (selalu return array)
app.get('/api/stories', verifyToken, (req, res) => {
  const activeStories = stories.filter(s => {
    const storyTime = new Date(s.createdAt);
    const now = new Date();
    const hoursDiff = (now - storyTime) / (1000 * 60 * 60);
    return hoursDiff < 24;
  });
  res.json(activeStories);
});

app.get('/api/contacts', verifyToken, (req, res) => {
  const userContacts = contacts
    .filter(c => c.userId === req.userId)
    .map(c => {
      const contactUser = users.find(u => u.id === c.contactId);
      if (!contactUser) return null;
      const { password, ...contact } = contactUser;
      return contact;
    })
    .filter(c => c !== null);
  res.json(userContacts);
});

app.get('/api/contacts/requests', verifyToken, (req, res) => {
  const pendingRequests = contactRequests.filter(
    r => r.toUserId === req.userId && r.status === 'pending'
  );
  const requestsWithSender = pendingRequests.map(r => {
    const sender = users.find(u => u.id === r.fromUserId);
    if (!sender) return null;
    const { password, ...senderData } = sender;
    return { ...r, sender: senderData };
  }).filter(r => r !== null);
  res.json(requestsWithSender);
});

app.post('/api/contacts/request', verifyToken, (req, res) => {
  const { username } = req.body;
  const targetUser = users.find(u => u.username === username);
  if (!targetUser) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  if (targetUser.id === req.userId) {
    return res.status(400).json({ error: 'Tidak bisa request sendiri' });
  }
  const alreadyContact = contacts.some(
    c => (c.userId === req.userId && c.contactId === targetUser.id) ||
         (c.userId === targetUser.id && c.contactId === req.userId)
  );
  if (alreadyContact) {
    return res.status(400).json({ error: 'Sudah menjadi kontak' });
  }
  const existingRequest = contactRequests.some(
    r => r.fromUserId === req.userId && r.toUserId === targetUser.id && r.status === 'pending'
  );
  if (existingRequest) {
    return res.status(400).json({ error: 'Request sudah dikirim' });
  }
  const newRequest = {
    id: contactRequests.length + 1,
    fromUserId: req.userId,
    toUserId: targetUser.id,
    status: 'pending',
    createdAt: new Date()
  };
  contactRequests.push(newRequest);
  res.json({ success: true, message: 'Request kontak terkirim' });
});

app.put('/api/contacts/request/:id', verifyToken, (req, res) => {
  const { status } = req.body;
  const requestId = parseInt(req.params.id);
  const request = contactRequests.find(r => r.id === requestId);
  if (!request) {
    return res.status(404).json({ error: 'Request tidak ditemukan' });
  }
  if (request.toUserId !== req.userId) {
    return res.status(403).json({ error: 'Tidak punya akses' });
  }
  if (status === 'accepted') {
    request.status = 'accepted';
    contacts.push({ id: contacts.length + 1, userId: request.fromUserId, contactId: request.toUserId });
    contacts.push({ id: contacts.length + 2, userId: request.toUserId, contactId: request.fromUserId });
  } else if (status === 'rejected') {
    request.status = 'rejected';
  }
  res.json({ success: true, message: `Request ${status}` });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS bekerja!', timestamp: new Date().toISOString() });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('register', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
  });
  socket.on('send_message', (data) => {
    const { toUserId, message, fromUserId } = data;
    io.to(`user_${toUserId}`).emit('receive_message', { fromUserId, message, timestamp: new Date() });
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
