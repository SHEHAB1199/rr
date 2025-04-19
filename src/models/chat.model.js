// models/chatModel.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        senderType: {
            type: String,
            required: true,
            enum: ['user', 'doctor', 'lab', 'delivery'],
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        receiverType: {
            type: String,
            required: true,
            enum: ['user', 'doctor', 'lab', 'delivery'],
        },
        message: {
            type: String,
            default: '', // Optional for media messages
        },
        media: {
            type: String, // URL to the media file (image, video, document)
            default: '',
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'video', 'document'],
            default: 'text',
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'seen'],
            default: 'sent',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const chatModel = mongoose.model('chat', chatSchema);

module.exports = chatModel;