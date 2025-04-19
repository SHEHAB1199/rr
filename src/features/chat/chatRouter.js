// routes/chatRouter.js
const express = require('express');
const chatController = require('./chatController');

const router = express.Router();

// Send a message
router.post('/send', chatController.sendMessage);

// Get messages between two users
router.get('/messages/:sender/:receiver', chatController.getMessages);

// Mark messages as seen
router.post('/mark-seen', chatController.markMessagesAsSeen);

module.exports = router;