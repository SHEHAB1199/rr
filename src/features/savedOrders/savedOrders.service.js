const savedOrders = require("../../models/svaedOrders.model");
const deliverOrders = require("../../models/deliveryOrders");

class SavedOrderService {
    static async addOrder(doctorId, orderId, labId) {
        const existDocument = await savedOrders.findOne({ doctorId, labId });

        if (existDocument) {
            if (existDocument.orders.includes(orderId)) {
                return {
                    status: 400,
                    message: "Order already saved",
                }
            }
            existDocument.orders.push(orderId);
            await existDocument.save();
            return { status: 200, message: "Order saved successfully" };
        }

        const newDocument = new savedOrders({ doctorId, labId, orders: [orderId] });
        await newDocument.save();
        return { status: 200, message: "Order created and saved successfully" };
    }

    static async sendOrder(doctorId, labId) {
        const savedDoc = await savedOrders.findOneAndDelete({ doctorId, labId });
        if (!savedDoc){
            return {
                status: 400,
                message: "No orders saved",
            }
        }

        const existingDeliverDoc = await deliverOrders.findOne({ doctorId, labId });

        if (existingDeliverDoc) {
            existingDeliverDoc.orders.push(...savedDoc.orders);
            await existingDeliverDoc.save();
        } else {
            const newDeliverDoc = new deliverOrders({
                doctorId,
                labId,
                orders: savedDoc.orders,
            });
            await newDeliverDoc.save();
        }

        return { status: 200, message: "Orders delivered successfully" };
    }

    static async getSavedOrders(doctorId) {
        try {
            const savedOrder = await savedOrders.find({ doctorId }).populate("orders"); // optional populate
            return {
                status: 200,
                data: savedOrder,
                message: "Saved orders fetched successfully"
            };
        } catch (error) {
            return {
                status: 500,
                message: error.message
            };
        }
    }
}

module.exports = SavedOrderService;
