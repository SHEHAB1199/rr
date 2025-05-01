const mongoose = require('mongoose');

const deliverOrders = new mongoose.Schema({
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "orders",
            required: true,
            unique: true,
        },
        labId: {
            type: mongoose.Types.ObjectId,
            ref: 'labs'
        },
        orders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "orders",
            },
        ],
    },
    { timestamps: true }
);

const deliverOrdersModel = mongoose.model('deliverOrders', deliverOrders);
module.exports = deliverOrdersModel;