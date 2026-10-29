
import deliveryModel from "../models/deliveryModel.js";

const roleMiddleware = (allowedRole) => {
    return async (req, res, next) => {
        try {
            // Check whether the user has the required role
            if (!req.user || req.user.role !== allowedRole) {
                return res.status(403).json({
                    message: "Access denied",
                    status: 0
                });
            }

            // Check current status of delivery partners
            if (allowedRole === "delivery") {
                const delivery = await deliveryModel.findById(req.user.id);

                if (!delivery || !delivery.isActive) {
                    return res.status(403).json({
                        message: "Your delivery account is inactive or unavailable",
                        status: 0
                    });
                }
            }

            return next();

        } catch (error) {
            console.error("Role middleware error:", error);

            return res.status(500).json({
                message: "Authorization failed",
                status: 0
            });
        }
    };
};

export default roleMiddleware;

