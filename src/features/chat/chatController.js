// controllers/chatController.js
const chatService = require('./chatService');

// Send a message
const sendMessage = async (req, res) => {
    try {
        const message = req.body;
        const newMessage = await chatService.sendMessage(message);
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
};

// Get messages between two users
const getMessages = async (req, res) => {
    try {
        const { sender, receiver } = req.params;
        const messages = await chatService.getMessages(sender, receiver);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve messages', error: error.message });
    }
};

// Mark messages as seen
const markMessagesAsSeen = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const result = await chatService.markMessagesAsSeen(sender, receiver);
        res.status(200).json({ message: 'Messages marked as seen', result });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark messages as seen', error: error.message });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    markMessagesAsSeen,
};