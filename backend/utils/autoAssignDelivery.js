import orderModel from "../models/orderModel.js";
import deliveryModel from "../models/deliveryModel.js";

/**
 * Assigns a dispatched order to the oldest approved, active delivery partner
 * who has no other order currently out for delivery. If nobody is available,
 * the order stays unassigned and remains visible in Get Deliveries.
 */
export default async function autoAssignDelivery(orderId) {
  const busyDeliveryIds = await orderModel.distinct("deliveryId", {
    status: "Out for Delivery",
    deliveryId: { $ne: null },
    _id: { $ne: orderId },
  });

  const availableDelivery = await deliveryModel
    .findOne({
      isActive: true,
      isApproved: true,
      _id: { $nin: busyDeliveryIds },
    })
    .sort({ createdAt: 1 })
    .select("_id deliveryName email phone");

  if (!availableDelivery) return null;

  // Conditional update ensures this helper won't overwrite an existing assignment.
  const assignedOrder = await orderModel.findOneAndUpdate(
    { _id: orderId, status: "Out for Delivery", deliveryId: null },
    { $set: { deliveryId: availableDelivery._id } },
    { new: true }
  );

  if (!assignedOrder) return null;
  return { order: assignedOrder, delivery: availableDelivery };
}
