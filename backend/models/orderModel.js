import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        deliveryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Delivery",
            default: null,
        },

        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },

                productName: {
                    type: String,
                    required: true,
                },

                price: {
                    type: Number,
                    required: true,
                },

                quantity: {
                    type: Number,
                    required: true,
                },

                subtotal: {
                    type: Number,
                    required: true,
                },
            },
        ],

        subtotalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        couponCode: {
            type: String,
            default: null,
            trim: true,
            uppercase: true,
        },

    restaurantOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantOffer",
      default: null,
    },
    restaurantOfferName: { type: String, default: null, trim: true },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["COD", "Online"],
            default: "COD",
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending",
        },
        deliveryOtpHash: {
            type: String,
            default: null,
            select: false,
        },
        deliveryOtpExpiresAt: {
            type: Date,
            default: null,
            select: false,
        },

        refundId: {
            type: String,
            default: null,
        },

        refundStatus: {
            type: String,
            enum: ["Not Initiated", "Processing", "Processed", "Failed", "Manual Required"],
            default: "Not Initiated",
        },

        refundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        refundProcessedAt: {
            type: Date,
            default: null,
        },

        refundFailureReason: {
            type: String,
            default: "",
        },
        razorpayOrderId: {
            type: String,
            default: null,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
        },
        deliveryAddress: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Accepted",
                "Preparing",
                "Out for Delivery",
                "Delivered",
                "Cancelled",
            ],
            default: "Pending",
        },
        cancellationReason: {
            type: String,
            trim: true,
            default: "",
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        deliveryDeadlineAt: {
            type: Date,
            default: null,
        },
        returnStatus: {
        type: String,
        enum: [
            "Not Requested",
            "Return Requested",
            "Approved",
            "Rejected"
        ],
        default: "Not Requested"
    },

    returnReason: {
        type: String,
        trim: true,
        default: ""
    },

    returnRequestedAt: {
        type: Date,
        default: null
    },

    returnReviewedAt: {
        type: Date,
        default: null
    },

    returnAdminNote: {
        type: String,
        trim: true,
        default: ""
    },
    },
    {
        timestamps: true,
    }
);

orderSchema.index(
    { razorpayOrderId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            razorpayOrderId: { $type: "string" },
        },
    }
);

orderSchema.index(
    { razorpayPaymentId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            razorpayPaymentId: { $type: "string" },
        },
    }
);


const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;