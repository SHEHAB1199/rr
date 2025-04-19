const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        commenterId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "commenterType",
            required: true,
        },
        commenterType: {
            type: String,
            required: true,
            enum: ["users", "doctors", "labs", "deliveries"], // Match registered model names
        },
        commentText: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const postSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "createdByType",
            required: true,
        },
        createdByType: {
            type: String,
            required: true,
            enum: ["users", "doctors", "labs", "deliveries"], // Match registered model names
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            default: [],
        },
        usersReacted: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "user",
            default: [],
        },
        comments: {
            type: [commentSchema],
            default: [],
        },
    },
    { timestamps: true }
);

const postModel = mongoose.model("Post", postSchema);

module.exports = postModel;