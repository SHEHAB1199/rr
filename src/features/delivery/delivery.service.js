const ordersModel = require('../../models/order.model');
const mongoose = require('mongoose');
class DeliveryService {
    static async getAvailableOrders(deliveryRole) {
        try {
            if (deliveryRole !== "del") {
                return { success: false, message: "Unauthorized", status: 401 };
            }

            const orders = await ordersModel.find({
                taked: false,
                $or: [
                    { status: { $regex: '^DoctorReady' } },
                    { status: { $regex: '^LabReady' } }
                ]
            }) .populate({
                path: "doctorId",
                select: "UID username phoneNumber address floorNo buildNo"
            })
                .populate({
                    path: "labId",
                    select: "UID username phoneNumber address floorNo buildNo"
                })


            return {
                success: true,
                data: orders,
                message: "Orders retrieved successfully",
                status: 200
            };

        } catch (error) {
            console.error("[DeliveryService] getAvailableOrders error:", error);
            return {
                success: false,
                message: error.message,
                status: 500
            };
        }
    }

    static async takeOrder(deliveryId, orderId) {
        try {
            const updatedOrder = await ordersModel.findOneAndUpdate(
                { _id: orderId, taked: false },
                { taked: true, delivery: deliveryId },
                { new: true }
            );


            if (!updatedOrder) {
                return {
                    success: false,
                    message: "Order not found",
                    status: 404
                };
            }

            return {
                success: true,
                data: updatedOrder,
                message: "Order taken successfully",
                status: 200
            };

        } catch (error) {
            console.error("[DeliveryService] takeOrder error:", error);
            return {
                success: false,
                message: error.message,
                status: 500
            };
        }
    }

    static async endTask(deliveryId, orderId) {
        try {
            const order = await ordersModel.findById(orderId);
            if (!order) {
                return {
                    success: false,
                    message: "Order not found",
                    status: 404
                };
            }

            // Determine if the status is final or pending
            const isFinal = order.status.includes("(f)");
            const statusType = isFinal ? "(f)" : "(p)";

            // Extract base status without (f) or (p)
            const baseStatus = order.status.replace(/\([fp]\)$/, '').trim();

            // Fixed: use consistent status names matching DB (e.g., "DoctorReady" instead of "DocReady")
            const statusTransitions = {
                "DoctorReady": `lab received${statusType}`,
                // "going to lab": `lab received${statusType}`,
                // "lab received": `underway${statusType}`,
                "lab ready": `return to doctor${statusType}`,
                "going to doctor": `end${statusType}`
            };


            // Validate status transition
            if (!statusTransitions[baseStatus]) {
                return {
                    success: false,
                    message: `Invalid status transition from '${order.status}'`,
                    status: 400
                };
            }

            // Update order status and delivery tracking
            order.status = statusTransitions[baseStatus];
            order.taked = false;

            // Prevent duplicate deliveryId entries
            if (!order.delivery.includes(deliveryId)) {
                order.delivery.push(deliveryId);
            }

            await order.save();

            return {
                success: true,
                data: order,
                message: `Status updated to ${order.status}`,
                status: 200
            };

        } catch (error) {
            console.error("[DeliveryService] endTask error:", error);
            return {
                success: false,
                message: error.message,
                status: 500
            };
        }
    }
    static async myOrders(deliveryId) {
        try {
            // First get the base orders without population
            const orders = await ordersModel.find({
                delivery: deliveryId,
                taked: true
            }).lean();

            // Prepare all population promises
            const populatedOrders = await Promise.all(orders.map(async (order) => {
                try {
                    // Parallel population of all references
                    const [doctor, lab] = await Promise.all([
                        order.doctorId ?
                            mongoose.model('doctors').findById(order.doctorId).select("username phoneNumber buildNo floorNo address").lean().catch(() => null) :
                            Promise.resolve(null),

                        order.labId ?
                            mongoose.model('labs').findById(order.labId).select("username phoneNumber buildNo floorNo address").lean().catch(() => null) :
                            Promise.resolve(null)
                    ]);

                    // Skip orders with invalid doctorIds
                    if (order.doctorId && !doctor) return null;

                    return {
                        ...order,
                        doctorId: doctor,
                        labId: lab,
                    };
                } catch (error) {
                    console.error(`Error populating order ${order._id}:`, error);
                    return null;
                }
            }));

            // Filter out null values (failed populations)
            const validOrders = populatedOrders.filter(order => order !== null);

            return {
                success: true,
                status: 200,
                message: "Orders retrieved successfully",
                data: validOrders
            };
        } catch(error) {
            console.error("[DeliveryService] myOrders error:", error);
            return {
                success: false,
                message: "Error retrieving orders",
                status: 500,
                data: []
            };
        }
    }
}

module.exports = DeliveryService;