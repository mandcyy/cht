const store = require('../services/store');

// PUT /api/profile/avatar — update foto profil
function updateAvatar(req, res) {
  const { photoData, displayName } = req.body;

  if (!photoData && !displayName)
    return res.status(400).json({ error: 'photoData atau displayName harus diisi' });

  if (photoData && photoData.length > 3 * 1024 * 1024)
    return res.status(400).json({ error: 'Foto max 3MB' });

  const patch = {};
  if (displayName?.trim()) patch.displayName = displayName.trim();
  if (photoData) {
    // Store photo as data URL — overrides initials avatar
    patch.avatar = {
      ...store.getUser(req.user.id).avatar,
      photo: photoData,
    };
  }

  store.updateUser(req.user.id, patch);
  const updated = store.safeUser(req.user.id);

  // Broadcast updated profile to all online contacts
  const io = req.app.get('io');
  const contactIds = store.getContacts(req.user.id).map(c => c.id);
  contactIds.forEach(cId => {
    const sid = store.getSocketId(cId);
    if (sid) io.to(sid).emit('profile:updated', { userId: req.user.id, avatar: updated.avatar, displayName: updated.displayName });
  });

  res.json({ user: updated });
}

module.exports = { updateAvatar };
