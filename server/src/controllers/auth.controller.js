// controllers/auth.controller.js
const jwt = require('jsonwebtoken');

// Data sementara (nanti pindah ke database)
const users = [];

// Register
const register = async (req, res) => {
    try {
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
            avatar: null,
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            process.env.JWT_SECRET || 'rahasia123',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Register berhasil',
            user: {
                id: newUser.id,
                username: newUser.username,
                displayName: newUser.displayName,
                avatar: newUser.avatar
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            return res.status(401).json({ error: 'Username atau password salah' });
        }
        
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'rahasia123',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login berhasil',
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get current user (me)
const me = async (req, res) => {
    try {
        const userId = req.userId; // Dari middleware authHTTP
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, me };
