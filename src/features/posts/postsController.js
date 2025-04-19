const asyncHandler = require("express-async-handler");
const {
    createPost,
    getAllPosts,
    createReact,
    createComment,
    deletePost,
    getUserPosts,
} = require("./postsService");

// Create a new post
const createPostController = asyncHandler(async (req, res) => {
    const { createdBy, createdByType, title, description, images } = req.body;

    if (!createdBy || !createdByType || !title || !description) {
        return res.status(400).json({ message: "All required fields must be provided" });
    }

    try {
        const post = await createPost(createdBy, createdByType, title, description, images);
        return res.status(201).json(post);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
});

// Get all posts with reaction status for the current user
const getAllPostsController = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const posts = await getAllPosts(userId);
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
});

// Add or remove a reaction to a post
const createReactController = asyncHandler(async (req, res) => {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
        return res.status(400).json({ message: "Post ID and User ID are required" });
    }

    try {
        const post = await createReact(postId, userId);
        return res.status(200).json(post);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
});

// Add a comment to a post
const createCommentController = asyncHandler(async (req, res) => {
    const { postId, commenterId, commenterType, commentText } = req.body;

    if (!postId || !commenterId || !commenterType || !commentText) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const post = await createComment(postId, commenterId, commenterType, commentText);
        return res.status(200).json(post);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
});

// Delete a post
const deletePostController = asyncHandler(async (req, res) => {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
        return res.status(400).json({ message: "Post ID and User ID are required" });
    }

    try {
        const result = await deletePost(postId, userId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
});

// Get all posts created by a specific user
const getUserPostsController = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const posts = await getUserPosts(userId);
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
});

module.exports = {
    createPostController,
    getAllPostsController,
    createReactController,
    createCommentController,
    deletePostController,
    getUserPostsController,
};