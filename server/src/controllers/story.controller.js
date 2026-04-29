// controllers/story.controller.js
const stories = [];

const listStories = async (req, res) => {
    try {
        const activeStories = stories.filter(s => {
            const hoursDiff = (new Date() - new Date(s.createdAt)) / (1000 * 60 * 60);
            return hoursDiff < 24;
        });
        res.json(activeStories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createStory = async (req, res) => {
    try {
        const { content, mediaUrl } = req.body;
        const userId = req.userId;
        
        const newStory = {
            id: stories.length + 1,
            userId,
            content,
            mediaUrl,
            views: [],
            createdAt: new Date()
        };
        
        stories.push(newStory);
        res.json({ success: true, story: newStory });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const viewStory = async (req, res) => {
    try {
        const storyId = parseInt(req.params.id);
        const userId = req.userId;
        
        const story = stories.find(s => s.id === storyId);
        if (!story) {
            return res.status(404).json({ error: 'Story tidak ditemukan' });
        }
        
        if (!story.views.includes(userId)) {
            story.views.push(userId);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteStory = async (req, res) => {
    try {
        const storyId = parseInt(req.params.id);
        const userId = req.userId;
        
        const storyIndex = stories.findIndex(s => s.id === storyId && s.userId === userId);
        if (storyIndex === -1) {
            return res.status(404).json({ error: 'Story tidak ditemukan atau bukan milik anda' });
        }
        
        stories.splice(storyIndex, 1);
        res.json({ success: true, message: 'Story dihapus' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { listStories, createStory, viewStory, deleteStory };
