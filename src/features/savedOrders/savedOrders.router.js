const express = require("express");
const router = express.Router();
const SavedOrderController = require("./savedOrders.controller");

// Middleware (optional, for auth)
const authinticatedDoctor = require("../../middlewares/authincateDoctor");

router.post("/add", authinticatedDoctor, async (req, res) => {
    const response = await SavedOrderController.addOrder(req);
    res.status(response.status).json(response);
});

router.post("/send/:labId", authinticatedDoctor, async (req, res) => {
    const response = await SavedOrderController.sendOrder(req);
    res.status(response.status).json(response);
});

router.get("/get-orders", authinticatedDoctor, async (req, res) => {
    const response = await SavedOrderController.getOrders(req);
    res.status(response.status).json({
        message: response.message,
        orders: response.orders,
    });
});
module.exports = router;