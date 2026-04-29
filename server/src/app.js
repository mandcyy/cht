require('dotenv').config();
const http = require('http');
const app  = require('./config/express');
const { initSocket } = require('./socket');

const PORT   = process.env.PORT || 4000;
const server = http.createServer(app);
const io     = initSocket(server);

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

server.listen(PORT, () =>
  console.log(`[SERVER] ✅ http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`)
);

process.on('SIGTERM', () => server.close(() => process.exit(0)));
