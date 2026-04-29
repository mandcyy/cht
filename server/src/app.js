const express = require('express');
const cors = require('cors');
const app = express();

// ========== KONFIGURASI CORS KHUSUS RENDER ==========
// Izinkan semua origin (biar frontend di Render bisa akses)
app.use(cors({
  origin: 'https://cht-2.onrender.com', // Atau ganti dengan 'https://cht-2.onrender.com'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight request (penting buat Render)
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== ROUTES ==========
// Route register
app.post('/api/auth/register', (req, res) => {
  const { email, password, username } = req.body;
  
  // Ganti dengan logic register asli kamu
  res.json({
    success: true,
    message: 'Register berhasil',
    data: { email, username }
  });
});

// Route login (contoh)
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login berhasil'
  });
});

// Route test CORS
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'CORS bekerja!', 
    timestamp: new Date().toISOString() 
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 CORS enabled for all origins (including Render frontend)`);
});
