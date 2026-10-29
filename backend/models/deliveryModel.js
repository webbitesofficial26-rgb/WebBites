import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    deliveryName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    profilePicture: { type: String, default: "" },
    profilePicturePublicId: { type: String, default: "" },
     isActive: {
      type: Boolean,
      default: false,
    },
    // Existing delivery accounts remain approved by default; new registrations explicitly set false.
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const deliveryModel = mongoose.model(
  "Delivery",
  deliverySchema
);

export default deliveryModel;