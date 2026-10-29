
import mongoose from "mongoose";

const paymentAttemptSchema = new mongoose.Schema(
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

    deliveryAddress: {
      type: String,
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    status: {
      type: String,
      enum: ["Created", "Paid", "Failed"],
      default: "Created",
    },
  },
  { timestamps: true }
);

const paymentAttemptModel = mongoose.model(
  "PaymentAttempt",
  paymentAttemptSchema
);

export default paymentAttemptModel;
