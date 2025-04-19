const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    username: {
        type: String,
        require: true
    },
    phoneNumber:{
        type: String,
        required: true
    },
    password: {
        type: String
    },
    favouritePosts: {
        type:[]
    },
    posts: {
        type: []
    },
    role: {
        type: String,
        default: "delivery"
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }],
    earnings: [{
        lab: { type: mongoose.Schema.Types.ObjectId, ref: "lab" },
        totalEarned: { type: Number, default: 0 } 
    }],
    otp: { type: String },
    otpExpiresAt: { type: Date },
    isVerified: { type: Boolean, default: false },
}, {timestamps: true});

const deliveryModel = mongoose.model('delivery', deliverySchema);

module.exports = deliveryModel