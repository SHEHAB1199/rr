require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const app = express();
const port = process.env.PORT || 5000;
const connectDB = require("./src/config/dbConnection");
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup
const socketIo = require('socket.io');
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.send('backend reception robot running');
})

// Make io globally available
global.io = io;
require('./src/config/socket/socketManager')(io);

// Routes
const doctorsRoutes = require("./src/features/auth/doctor/doctorRouter");
const labsRoutes = require("./src/features/auth/labs/labsRouter");
const deliveryRoutes = require("./src/features/auth/delivery/deliveryRouter");
const userRouter = require("./src/features/auth/normal user/userRouter");
const postsRoute = require("./src/features/posts/postsRouter");
const chatRouter = require("./src/features/chat/chatRouter");
const doctorsDashboard = require("./src/features/doctorDashboard/doctorRouter");
const ordersRoute = require("./src/features/orders/orders.router");
const labsOrders = require("./src/features/laboratory/lab.router");
const deliveryWork = require("./src/features/delivery/delivery.router");

app.use('/doctors', doctorsRoutes);
app.use('/labs', labsRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/user', userRouter);
app.use('/posts', postsRoute);
app.use('/chat', chatRouter);
app.use('/docdash', doctorsDashboard);
app.use('/orders', ordersRoute);
app.use('/labdash', labsOrders);
app.use('/del', deliveryWork);

// Sample Route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server with the HTTP server instance, not the Express app
server.listen(port, () => {
    console.log(`🚀 SERVER RUNNING ON PORT ${port}`);
});