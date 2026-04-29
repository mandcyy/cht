// controllers/contacts.controller.js
const users = []; // Harus sinkron dengan auth controller
const contacts = [];
const contactRequests = [];

// List semua kontak user
const listContacts = async (req, res) => {
    try {
        const userId = req.userId;
        const myContacts = contacts.filter(c => c.userId === userId);
        const contactUsers = myContacts
            .map(c => users.find(u => u.id === c.contactId))
            .filter(Boolean);
        
        const result = contactUsers.map(({ password, ...user }) => user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// List incoming contact requests
const listRequests = async (req, res) => {
    try {
        const userId = req.userId;
        const incoming = contactRequests.filter(
            r => r.toUserId === userId && r.status === 'pending'
        );
        
        const result = incoming.map(r => {
            const sender = users.find(u => u.id === r.fromUserId);
            if (!sender) return null;
            const { password, ...senderData } = sender;
            return { ...r, sender: senderData };
        }).filter(Boolean);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send contact request
const sendRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { username } = req.body;
        
        const targetUser = users.find(u => u.username === username);
        if (!targetUser) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        
        if (targetUser.id === userId) {
            return res.status(400).json({ error: 'Tidak bisa request sendiri' });
        }
        
        const alreadyContact = contacts.some(
            c => (c.userId === userId && c.contactId === targetUser.id) ||
                 (c.userId === targetUser.id && c.contactId === userId)
        );
        
        if (alreadyContact) {
            return res.status(400).json({ error: 'Sudah menjadi kontak' });
        }
        
        const existingRequest = contactRequests.some(
            r => r.fromUserId === userId && r.toUserId === targetUser.id && r.status === 'pending'
        );
        
        if (existingRequest) {
            return res.status(400).json({ error: 'Request sudah dikirim' });
        }
        
        const newRequest = {
            id: contactRequests.length + 1,
            fromUserId: userId,
            toUserId: targetUser.id,
            status: 'pending',
            createdAt: new Date()
        };
        
        contactRequests.push(newRequest);
        res.json({ success: true, message: 'Request kontak terkirim' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Accept contact request
const acceptRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { requestId } = req.body;
        
        const request = contactRequests.find(r => r.id === requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request tidak ditemukan' });
        }
        
        if (request.toUserId !== userId) {
            return res.status(403).json({ error: 'Tidak punya akses' });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request sudah diproses' });
        }
        
        request.status = 'accepted';
        
        contacts.push({
            id: contacts.length + 1,
            userId: request.fromUserId,
            contactId: request.toUserId
        });
        contacts.push({
            id: contacts.length + 2,
            userId: request.toUserId,
            contactId: request.fromUserId
        });
        
        res.json({ success: true, message: 'Request diterima' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject contact request
const rejectRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { requestId } = req.body;
        
        const request = contactRequests.find(r => r.id === requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request tidak ditemukan' });
        }
        
        if (request.toUserId !== userId) {
            return res.status(403).json({ error: 'Tidak punya akses' });
        }
        
        request.status = 'rejected';
        res.json({ success: true, message: 'Request ditolak' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    listContacts,
    listRequests,
    sendRequest,
    acceptRequest,
    rejectRequest
};
