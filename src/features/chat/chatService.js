// services/chatService.js
const chatModel = require('../../models/chat.model');

// Send a message
const sendMessage = async (message) => {
    try {
        const newMessage = await chatModel.create(message);
        return newMessage;
    } catch (error) {
        console.error('Error in sendMessage:', error);
        throw error;
    }
};

// Get messages between two users
const getMessages = async (sender, receiver) => {
    try {
        const messages = await chatModel.find({
            $or: [
                { sender, receiver },
                { sender: receiver, receiver: sender },
            ],
        }).sort({ timestamp: 1 });
        return messages;
    } catch (error) {
        console.error('Error in getMessages:', error);
        throw error;
    }
};

// Mark messages as seen
const markMessagesAsSeen = async (sender, receiver) => {
    try {
        const result = await chatModel.updateMany(
            { sender, receiver, status: 'delivered' },
            { $set: { status: 'seen' } }
        );
        return result;
    } catch (error) {
        console.error('Error in markMessagesAsSeen:', error);
        throw error;
    }
};

module.exports = {
    sendMessage,
    getMessages,
    markMessagesAsSeen,
};