const { v4 } = require('uuid');
const store = require('../services/store');

// GET /api/stories — semua story dari kontak + milik sendiri
function listStories(req, res) {
  store.pruneExpiredStories();
  const raw = store.getStoriesForUser(req.user.id);

  // Group by userId
  const grouped = {};
  raw.forEach(s => {
    if (!grouped[s.userId]) {
      const u = store.safeUser(s.userId);
      grouped[s.userId] = { user: u, stories: [], hasUnread: false };
    }
    const viewed = s.views.includes(req.user.id);
    if (!viewed && s.userId !== req.user.id) grouped[s.userId].hasUnread = true;
    grouped[s.userId].stories.push({ ...s, viewed });
  });

  // Own stories first, then contacts with unread, then rest
  const result = Object.values(grouped).sort((a, b) => {
    if (a.user.id === req.user.id) return -1;
    if (b.user.id === req.user.id) return  1;
    return (b.hasUnread - a.hasUnread);
  });

  res.json({ groups: result });
}

// POST /api/stories — upload story baru (image atau text)
function createStory(req, res) {
  const { type, content, mediaData, caption } = req.body;

  if (!type) return res.status(400).json({ error: 'type wajib diisi' });
  if (!['text','image'].includes(type)) return res.status(400).json({ error: 'type harus text atau image' });
  if (type === 'image' && !mediaData) return res.status(400).json({ error: 'mediaData wajib untuk story gambar' });
  if (type === 'text'  && !content)   return res.status(400).json({ error: 'content wajib untuk story teks' });

  // 5MB limit for story images
  if (mediaData && mediaData.length > 5 * 1024 * 1024)
    return res.status(400).json({ error: 'Gambar story max 5MB' });

  const story = store.addStory({
    id:        v4(),
    userId:    req.user.id,
    type,
    content:   content || '',
    mediaData: mediaData || null,
    caption:   caption  || '',
    views:     [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
  });

  // Broadcast ke semua kontak yang online
  const io = req.app.get('io');
  const contactIds = store.getContacts(req.user.id).map(c => c.id);
  contactIds.forEach(cId => {
    const sid = store.getSocketId(cId);
    if (sid) {
      io.to(sid).emit('story:new', {
        user: store.safeUser(req.user.id),
        story: { ...story, viewed: false },
      });
    }
  });

  res.status(201).json({ story });
}

// POST /api/stories/:id/view — tandai sudah dilihat
function viewStory(req, res) {
  const { id } = req.params;
  const story = store.stories.get(id);
  if (!story) return res.status(404).json({ error: 'Story tidak ditemukan' });

  store.markStoryViewed(id, req.user.id);

  // Notify story owner (view count update) jika online
  const ownerSid = store.getSocketId(story.userId);
  if (ownerSid) {
    const io = req.app.get('io');
    io.to(ownerSid).emit('story:viewed', { storyId: id, viewerId: req.user.id, viewCount: story.views.length });
  }

  res.json({ ok: true });
}

// DELETE /api/stories/:id — hapus story milik sendiri
function deleteStory(req, res) {
  const { id } = req.params;
  const story = store.stories.get(id);
  if (!story)                       return res.status(404).json({ error: 'Story tidak ditemukan' });
  if (story.userId !== req.user.id) return res.status(403).json({ error: 'Bukan story milikmu' });
  store.stories.delete(id);
  res.json({ ok: true });
}

module.exports = { listStories, createStory, viewStory, deleteStory };
