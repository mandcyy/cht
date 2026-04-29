const express = require('express');
const cors = require('cors');
const app = express();

// 🔥 KONFIGURASI CORS YANG BENAR
// Ganti dengan URL frontend Render kamu
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cht-2.onrender.com';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware lainnya
app.use(express.json());

// Import routes (sesuaikan dengan struktur folder kamu)
const routes = require('./routes'); // atau './routes/index.js'
app.use('/', routes);

// Handle preflight requests secara otomatis
app.options('*', cors());

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${FRONTEND_URL}`);
});
