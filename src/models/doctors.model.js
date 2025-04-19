const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    UID: {
        type: String,
        required: true,
        maxLength: 255,
    },
    username: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    buildNo: {
        type: String,
        required: true
    },
    floorNo: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: "",
    },
    address: {
        type: String
    },
    profileImage: {
        type: String,
        default: "",
    },
    password: {
        type: String,
        required: true
    },
    favouritePosts: {
        type: Array,
        default: []
    },
    posts: {
        type: Array,
        default: []
    },
    role: {
        type: String,
        default: "doctor"
    },
    subscribeWithLabs: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "labs",
        default: [],
    },
    orders: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "orders",
        default: []
    },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const doctorsModel = mongoose.model('doctors', doctorSchema);
module.exports = doctorsModel;
