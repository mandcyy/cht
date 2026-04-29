const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

// ========== KONFIGURASI ==========
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_secret_ganti_nanti';

// ========== KONFIGURASI CORS KHUSUS RENDER ==========
app.use(cors({
  origin: 'https://cht-2.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight request
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== MIDDLEWARE VERIFY TOKEN ==========
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid atau expired.' });
  }
};

// ========== DATA SEMENTARA (GANTI PAKAI DATABASE NANTI) ==========
const users = [];

// ========== ROUTE REGISTER ==========
app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName } = req.body;
  
  // Validasi
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }
  
  // Cek username sudah ada?
  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.status(400).json({ error: 'Username sudah digunakan' });
  }
  
  // Buat user baru
  const newUser = {
    id: users.length + 1,
    username,
    password, // CATATAN: Di production password HARUS di-hash!
    displayName: displayName || username,
    createdAt: new Date()
  };
  
  users.push(newUser);
  
  // Buat JWT token
  const token = jwt.sign(
    { userId: newUser.id, username: newUser.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Kirim response (tanpa password)
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({
    success: true,
    message: 'Register berhasil',
    user: userWithoutPassword,
    token
  });
});

// ========== ROUTE LOGIN ==========
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Cari user
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }
  
  // Cek password
  if (user.password !== password) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }
  
  // Buat token
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Kirim response (tanpa password)
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    message: 'Login berhasil',
    user: userWithoutPassword,
    token
  });
});

// ========== ROUTE GET CURRENT USER (YANG KAMU MINTA) ==========
app.get('/api/auth/me', verifyToken, (req, res) => {
  // Cari user berdasarkan userId dari token
  const user = users.find(u => u.id === req.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  
  // Kirim data user (tanpa password)
  const { password, ...userWithoutPassword } = user;
  res.json({
    success: true,
    user: userWithoutPassword
  });
});

// ========== ROUTE TEST CORS ==========
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'CORS bekerja!', 
    timestamp: new Date().toISOString() 
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 CORS enabled for https://cht-2.onrender.com`);
});
