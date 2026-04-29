const router = require('express').Router();
const { register, login, me }                          = require('../controllers/auth.controller');
const { listContacts, listRequests, sendRequest,
        acceptRequest, rejectRequest }                 = require('../controllers/contacts.controller');
const { listStories, createStory, viewStory,
        deleteStory }                                  = require('../controllers/story.controller');
const { updateAvatar }                                 = require('../controllers/profile.controller');
const { authHTTP }                                     = require('../middleware/auth');

// Auth
router.post('/auth/register', register);
router.post('/auth/login',    login);
router.get ('/auth/me',       authHTTP, me);

// Contacts
router.get ('/contacts',          authHTTP, listContacts);
router.get ('/contacts/requests', authHTTP, listRequests);
router.post('/contacts/request',  authHTTP, sendRequest);
router.post('/contacts/accept',   authHTTP, acceptRequest);
router.post('/contacts/reject',   authHTTP, rejectRequest);

// Stories
router.get ('/stories',          authHTTP, listStories);
router.post('/stories',          authHTTP, createStory);
router.post('/stories/:id/view', authHTTP, viewStory);
router.delete('/stories/:id',    authHTTP, deleteStory);

// Profile
router.put('/profile/avatar', authHTTP, updateAvatar);

router.get('/health', (_, res) => res.json({ ok: true }));

module.exports = router;

router.use('/api', apiRouter);
