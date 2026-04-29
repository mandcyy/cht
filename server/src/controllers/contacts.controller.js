const store = require('../services/store');

// GET /api/contacts — confirmed contacts
function listContacts(req, res) {
  res.json({ contacts: store.getContacts(req.user.id) });
}

// GET /api/contacts/requests — incoming pending requests
function listRequests(req, res) {
  res.json({ requests: store.getIncomingRequests(req.user.id) });
}

// POST /api/contacts/request — kirim permintaan kontak
function sendRequest(req, res) {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username wajib diisi' });

  const target = store.getUserByUsername(username.trim());
  if (!target)                                    return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
  if (target.id === req.user.id)                  return res.status(400).json({ error: 'Tidak bisa menambah diri sendiri' });
  if (store.hasContact(req.user.id, target.id))   return res.status(409).json({ error: 'Sudah ada di kontak' });

  const request = store.sendRequest(req.user.id, target.id);
  if (!request) return res.status(409).json({ error: 'Permintaan sudah dikirim sebelumnya' });

  // Kirim notif real-time ke target kalau sedang online
  const targetSocketId = store.getSocketId(target.id);
  if (targetSocketId) {
    const io = req.app.get('io');
    io.to(targetSocketId).emit('contact:request', {
      requestId: request.id,
      from: store.safeUser(req.user.id),
      createdAt: request.createdAt,
    });
  }

  res.status(201).json({ message: 'Permintaan kontak berhasil dikirim' });
}

// POST /api/contacts/accept — terima permintaan
function acceptRequest(req, res) {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'requestId wajib diisi' });

  const request = store.getRequestById(requestId);
  if (!request)                         return res.status(404).json({ error: 'Permintaan tidak ditemukan' });
  if (request.toId !== req.user.id)     return res.status(403).json({ error: 'Bukan permintaan untukmu' });

  store.addContact(request.fromId, request.toId);
  store.deleteRequest(requestId);

  const fromUser  = store.safeUser(request.fromId);
  const toUser    = store.safeUser(request.toId);

  // Notif ke pengirim request bahwa sudah diterima
  const fromSocketId = store.getSocketId(request.fromId);
  if (fromSocketId) {
    const io = req.app.get('io');
    io.to(fromSocketId).emit('contact:accepted', { contact: toUser });
  }

  res.json({ contact: fromUser });
}

// POST /api/contacts/reject — tolak permintaan
function rejectRequest(req, res) {
  const { requestId } = req.body;
  const request = store.getRequestById(requestId);
  if (!request)                     return res.status(404).json({ error: 'Permintaan tidak ditemukan' });
  if (request.toId !== req.user.id) return res.status(403).json({ error: 'Bukan permintaan untukmu' });

  store.deleteRequest(requestId);
  res.json({ message: 'Permintaan ditolak' });
}

module.exports = { listContacts, listRequests, sendRequest, acceptRequest, rejectRequest };
