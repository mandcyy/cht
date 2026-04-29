const cors = require('cors');

// Baca dari environment variable
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:1000';

// CORS untuk Express
app.use(cors({
  origin: https://cht-2.onrender.com,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CORS khusus untuk Socket.IO (kalo pake Socket.IO)
const io = require('socket.io')(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST']
  }
});
