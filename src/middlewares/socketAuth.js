module.exports = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) throw new Error('Authentication required');

        // Verify token using your existing auth logic
        const user = await verifyToken(token); // Implement your token verification

        // Attach user to socket
        socket.user = user;
        next();
    } catch (err) {
        console.error('Socket auth failed:', err.message);
        next(new Error('Authentication failed'));
    }
};