const mongoose = require("mongoose");

const savedOrdersSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "doctors",
            required: true,
        },
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "labs",
            required: true,
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

module.exports = mongoose.model("SavedOrder", savedOrdersSchema);
