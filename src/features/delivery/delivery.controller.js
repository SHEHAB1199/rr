const DeliveryService = require('./delivery.service');

class DeliveryController {
    static async getAvailableOrders(req, res) {
        const response = await DeliveryService.getAvailableOrders(req.del.role);
        return res.status(response.status).json({
            message: response.message,
            data: response.data,
            status: response.status
        });
    }

    static async takeOrder(req, res) {
        const response = await DeliveryService.takeOrder(
            req.del.id,
            req.params.id
        );
        return res.status(response.status).json({
            message: response.message,
            data: response.data,
            status: response.status
        });
    }

    static async endTask(req, res) {
        const response = await DeliveryService.endTask(
            req.del.id,
            req.params.orderId
        );
        return res.status(response.status).json({
            message: response.message,
            data: response.data,
            status: response.status
        });
    }
    static async myOrders(req, res) {
        try {
            const response = await DeliveryService.myOrders(req.del.id);

            // Additional validation
            if (!response.success || !response.data) {
                return res.status(response.status || 500).json({
                    success: false,
                    message: response.message || "Failed to retrieve orders",
                    data: []
                });
            }

            return res.status(response.status).json({
                success: true,
                message: response.message,
                data: response.data,
                status: response.status
            });
        } catch (error) {
            console.error("[DeliveryController] myOrders error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                data: []
            });
        }
    }
}

module.exports = DeliveryController;