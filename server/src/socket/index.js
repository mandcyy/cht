const { Server } = require('socket.io');
const { v4 } = require('uuid');
const { authSocket } = require('../middleware/auth');
const store = require('../services/store');

const MAX_MEDIA = 10 * 1024 * 1024; // 10MB

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:4000', process.env.CLIENT_ORIGIN].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    maxHttpBufferSize: 12e6,
    pingTimeout: 30000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  io.use(authSocket);

  io.on('connection', (socket) => {
    const { user } = socket;
    console.log(`[WS] ✅ ${user.username} connected (${socket.id})`);

    store.setOnline(user.id, socket.id);

    // ── Auto-join ALL existing rooms ──────────────────────────────────
    // This ensures user receives messages even if they haven't opened the chat
    const userRooms = store.getRoomsForUser(user.id);
    userRooms.forEach(room => socket.join(room.id));
    console.log(`[WS] ${user.username} auto-joined ${userRooms.length} rooms`);

    // ── Broadcast online status ───────────────────────────────────────
    socket.broadcast.emit('presence:online', {
      id: user.id, username: user.username,
      displayName: user.displayName, avatar: user.avatar, online: true,
    });

    // ── Send current online list ──────────────────────────────────────
    const onlineNow = store.allPublicUsers().filter(u => u.online && u.id !== user.id);
    socket.emit('presence:snapshot', onlineNow);

    // ── Deliver pending messages for all rooms ────────────────────────
    // For each room this user is in, send messages they missed while offline.
    // Client tells us its last known timestamp per room via `lastSeenAt`.
    userRooms.forEach(room => {
      const lastReadAt = store.getReadAt(room.id, user.id);
      const pending = store.getMessagesAfter(room.id, lastReadAt);
      if (pending.length > 0) {
        console.log(`[WS] Delivering ${pending.length} pending msgs to ${user.username} in room ${room.id}`);
        socket.emit('messages:pending', { roomId: room.id, messages: pending });
      }
    });

    // ── Pending contact requests ──────────────────────────────────────
    const pendingRequests = store.getIncomingRequests(user.id);
    if (pendingRequests.length > 0) {
      socket.emit('contact:requests_pending', pendingRequests);
    }

    // ── Room join (when user opens a chat) ────────────────────────────
    socket.on('room:join', (data, ack) => {
      try {
        const { targetUserId } = data || {};
        if (!targetUserId) return ack?.({ ok: false, error: 'targetUserId diperlukan' });
        if (!store.getUser(targetUserId)) return ack?.({ ok: false, error: 'User tidak ditemukan' });

        const room = store.getOrCreateRoom(user.id, targetUserId);
        socket.join(room.id);

        // Also join the other user if online
        const otherSocketId = store.getSocketId(targetUserId);
        if (otherSocketId) {
          const otherSocket = io.sockets.sockets.get(otherSocketId);
          if (otherSocket) otherSocket.join(room.id);
        }

        const otherReadAt = store.getReadAt(room.id, targetUserId);

        // Send full message history for this room to the opener
        const history = store.getMessages(room.id);

        console.log(`[WS] ${user.username} joined room ${room.id}, sending ${history.length} history msgs`);
        ack?.({ ok: true, roomId: room.id, otherReadAt, history });
      } catch (e) {
        console.error('[WS] room:join error:', e);
        ack?.({ ok: false, error: 'Server error' });
      }
    });

    // ── Send message ──────────────────────────────────────────────────
    socket.on('message:send', (payload, ack) => {
      try {
        const { roomId, content, type = 'text', mediaData } = payload || {};
        if (!roomId || !content) return ack?.({ ok: false, error: 'roomId dan content wajib' });

        const room = store.rooms.get(roomId);
        if (!room || !room.participants.includes(user.id))
          return ack?.({ ok: false, error: 'Bukan anggota room ini' });
        if (mediaData && mediaData.length > MAX_MEDIA)
          return ack?.({ ok: false, error: 'File max 10MB' });
        if (!['text', 'image', 'video'].includes(type))
          return ack?.({ ok: false, error: 'Tipe tidak valid' });

        const msg = {
          id: v4(), roomId,
          senderId: user.id,
          senderName: user.displayName,
          senderAvatar: user.avatar,
          content, type,
          ...(mediaData ? { mediaData } : {}),
          timestamp: new Date().toISOString(),
        };

        // ✅ SAVE message before emitting — this is the key fix
        store.saveMessage(msg);

        // Ensure all online participants are in the socket room
        room.participants.forEach(pid => {
          if (pid === user.id) return;
          const sid = store.getSocketId(pid);
          if (sid) {
            const otherSocket = io.sockets.sockets.get(sid);
            if (otherSocket && !otherSocket.rooms.has(roomId)) {
              otherSocket.join(roomId);
            }
          }
        });

        // Emit to all in room (online participants get it instantly)
        io.to(roomId).emit('message:new', msg);
        ack?.({ ok: true, messageId: msg.id });

        // Offline participants will get this message via messages:pending on next connect

      } catch (e) {
        console.error('[WS] message:send error:', e);
        ack?.({ ok: false, error: 'Server error' });
      }
    });

    // ── Read receipt ──────────────────────────────────────────────────
    socket.on('message:read', ({ roomId }) => {
      if (!roomId) return;
      const room = store.rooms.get(roomId);
      if (!room || !room.participants.includes(user.id)) return;
      const readAt = store.markRead(roomId, user.id);
      socket.to(roomId).emit('message:read', { roomId, readerId: user.id, readAt });
    });

    // ── Typing ───────────────────────────────────────────────────────
    socket.on('typing:on',  ({ roomId }) => {
      if (roomId) socket.to(roomId).emit('typing:on',  { userId: user.id, name: user.displayName, roomId });
    });
    socket.on('typing:off', ({ roomId }) => {
      if (roomId) socket.to(roomId).emit('typing:off', { userId: user.id, roomId });
    });

    // ── Presence request ─────────────────────────────────────────────
    socket.on('presence:request', () => {
      const onlineNow = store.allPublicUsers().filter(u => u.online && u.id !== user.id);
      socket.emit('presence:snapshot', onlineNow);
    });

    // ── Disconnect ────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[WS] ❌ ${user.username} disconnected (${reason})`);
      const uid = store.setOffline(socket.id);
      if (uid) socket.broadcast.emit('presence:offline', { userId: uid, lastSeen: new Date() });
    });
  });

  httpServer._io = io;
  return io;
}

module.exports = { initSocket };
