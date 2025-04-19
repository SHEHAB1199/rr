const express = require("express");
const router = express.Router();
const {
    createPostController,
    getAllPostsController,
    createReactController,
    createCommentController,
    deletePostController,
    getUserPostsController,
} = require("./postsController");

// Create a new post
router.post("/create", createPostController);

// Get all posts with reaction status for the current user
router.post("/all", getAllPostsController);

// Add or remove a reaction to a post
router.post("/react", createReactController);

// Add a comment to a post
router.post("/comment", createCommentController);

// Delete a post
router.delete("/delete", deletePostController);

// Get all posts created by a specific user
router.post("/user-posts", getUserPostsController);

module.exports = router;