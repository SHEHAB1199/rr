const SavedOrderService = require("./savedOrders.service");

class SavedOrderController {
  static async addOrder(req) {
    try {
      const doctorId = req.doctor.id;
      const { orderId, labId } = req.body;

      if (!orderId || !labId) {
        return { status: 400, message: "Order ID and Lab ID are required" };
      }

      const result = await SavedOrderService.addOrder(doctorId, orderId, labId);
      return { status: result.status, message: result.message };
    } catch (error) {
      console.error(error);
      return { status: 500, message: error.message };
    }
  }
  static async sendOrder(req) {
    try {
      const doctorId = req.doctor.id;
      const labId = req.params.labId;

      const result = await SavedOrderService.sendOrder(doctorId, labId);
      return { status: 200, message: result.message };
    } catch (error) {
      console.error(error);
      if (error.message === "No saved orders found") {
        return { status: 404, message: error.message };
      }
      return { status: 500, message: error.message };
    }
  }
  static async getOrders(req) {
    try {
      const doctorId = req.doctor.id;
      const response = await SavedOrderService.getSavedOrders(doctorId);
      return {
        status: response.status,
        message: response.message,
        orders: response.data
      };
    } catch (error) {
      return {
        status: 500,
        message: error.message,
        orders: null
      };
    }
  }
}

module.exports = SavedOrderController;
