import orderModel from "../models/orderModel.js";
import sendEmail from "./emailUtils.js";

const ACCEPTANCE_WINDOW_MS = 60 * 60 * 1000;
const AUTO_CANCEL_REASON = "This order was automatically cancelled because the restaurant did not accept it within 1 hour.";
const DELIVERY_TIMEOUT_REASON = "This order was automatically cancelled because it was not delivered within 1 hour after being marked Out for Delivery.";

let isRunning = false;

export const cancelExpiredPendingOrders = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
        const cutoff = new Date(Date.now() - ACCEPTANCE_WINDOW_MS);
        const expiredOrders = await orderModel.find({
            status: "Pending",
            createdAt: { $lte: cutoff },
        }).select("_id customerId restaurantId totalAmount paymentMethod paymentStatus createdAt").limit(100);

        for (const expiredOrder of expiredOrders) {
            // Conditional update prevents a restaurant accepting the order at the same time
            // from being overwritten by the expiry job.
            const result = await orderModel.updateOne(
                { _id: expiredOrder._id, status: "Pending", createdAt: { $lte: cutoff } },
                { $set: { status: "Cancelled", cancellationReason: AUTO_CANCEL_REASON, cancelledAt: new Date() } }
            );
            if (!result.modifiedCount) continue;

            try {
                const order = await orderModel.findById(expiredOrder._id)
                    .populate("customerId", "name email")
                    .populate("restaurantId", "restaurantName");
                if (order?.customerId?.email) {
                    let message = `${AUTO_CANCEL_REASON} Order ID: ${order._id}. Please place a new order if you still wish to order.`;
                    if (order.paymentMethod === "Online" && order.paymentStatus === "Paid") {
                        message += " Your online payment was already recorded; please contact WebBites support regarding the refund for this cancelled order.";
                    }
                    await sendEmail({
                        to: order.customerId.email,
                        name: order.customerId.name || "Customer",
                        subject: "Order Automatically Cancelled - WebBites",
                        message,
                        details: [
                            { label: "Order ID", value: String(order._id) },
                            { label: "Restaurant", value: order.restaurantId?.restaurantName || "Restaurant" },
                            { label: "Order Total", value: `₹${order.totalAmount}` },
                            { label: "Reason", value: AUTO_CANCEL_REASON },
                        ],
                    });
                }
            } catch (emailError) {
                console.error("Unable to notify customer about expired order:", emailError.message);
            }
            console.log(`Auto-cancelled unaccepted order ${expiredOrder._id}`);
        }

        // Orders dispatched by the restaurant must be delivered within one hour.
        const expiredDeliveries = await orderModel.find({
            status: "Out for Delivery",
            deliveryDeadlineAt: { $ne: null, $lte: new Date() },
        }).select("_id customerId restaurantId deliveryId totalAmount paymentMethod paymentStatus deliveryDeadlineAt").limit(100);

        for (const expiredOrder of expiredDeliveries) {
            const result = await orderModel.updateOne(
                { _id: expiredOrder._id, status: "Out for Delivery", deliveryDeadlineAt: { $ne: null, $lte: new Date() } },
                { $set: { status: "Cancelled", cancellationReason: DELIVERY_TIMEOUT_REASON, cancelledAt: new Date() } }
            );
            if (!result.modifiedCount) continue;

            try {
                const order = await orderModel.findById(expiredOrder._id)
                    .populate("customerId", "name email")
                    .populate("restaurantId", "restaurantName");
                if (order?.customerId?.email) {
                    let message = `${DELIVERY_TIMEOUT_REASON} Order ID: ${order._id}. Please contact WebBites support if you need assistance.`;
                    if (order.paymentMethod === "Online" && order.paymentStatus === "Paid") {
                        message += " Your online payment was already recorded; please contact WebBites support regarding the refund for this cancelled order.";
                    }
                    await sendEmail({
                        to: order.customerId.email,
                        name: order.customerId.name || "Customer",
                        subject: "Order Cancelled - Delivery Time Limit Exceeded",
                        message,
                        details: [
                            { label: "Order ID", value: String(order._id) },
                            { label: "Restaurant", value: order.restaurantId?.restaurantName || "Restaurant" },
                            { label: "Order Total", value: `₹${order.totalAmount}` },
                            { label: "Reason", value: DELIVERY_TIMEOUT_REASON },
                        ],
                    });
                }
            } catch (emailError) {
                console.error("Unable to notify customer about delivery timeout:", emailError.message);
            }
            console.log(`Auto-cancelled undelivered order ${expiredOrder._id}`);
        }
    } catch (error) {
        console.error("Pending order expiry check failed:", error.message);
    } finally {
        isRunning = false;
    }
};

export const startPendingOrderExpiryJob = () => {
    // Run once on startup and then once per minute. Expired acceptance and delivery
    // windows are cancelled within about one minute after their deadlines.
    void cancelExpiredPendingOrders();
    const timer = setInterval(() => void cancelExpiredPendingOrders(), 60 * 1000);
    timer.unref?.();
    return timer;
};
