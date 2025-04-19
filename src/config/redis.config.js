// config/redis.config.js
const redis = require('redis');

// Create a Redis client
const redisClient = redis.createClient();

// Handle Redis connection events
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

// Connect to Redis
redisClient.connect().then(() => {
    console.log('Redis client connected');
}).catch((err) => {
    console.error('Failed to connect to Redis:', err);
});

// Export the Redis client
module.exports = redisClient