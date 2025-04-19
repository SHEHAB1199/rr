// utility/redis.utility.js
const generateOrderKey = (orderId) => `order:${orderId}`;
const generateDoctorOrdersKey = (doctorId) => `orders:doctor:${doctorId}`;
const generateDateBasedOrdersKey = (doctorId, startDate, endDate) => `orders:doctor:${doctorId}:${startDate}:${endDate}`;
const generateStatusBasedOrdersKey = (doctorId, status) => `orders:doctor:${doctorId}:status:${status}`;
const generatePostKey = (postId) => `post:${postId}`;
const generateAllPostsKey = () => `posts:all`;
const generateUserPostsKey = (userId) => `posts:user:${userId}`;
const generateLabOrdersKey = (labId) => `orders:lab:${labId}`;
module.exports = {
    generateOrderKey,
    generateDoctorOrdersKey,
    generateDateBasedOrdersKey,
    generateStatusBasedOrdersKey,
    generatePostKey,
    generateAllPostsKey,
    generateUserPostsKey,
    generateLabOrdersKey
};