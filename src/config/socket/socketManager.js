module.exports = (io) => {
    // Connection event
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Authentication middleware
        socket.use((packet, next) => {
            require('../middlewares/socketAuth')(socket, next);
        });

        // Join room based on user type
        socket.on('join-room', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        // Error handling
        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });

        // Disconnect event
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    // Make io available for other modules
    global.io = io;
};