import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
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
    coverImage: { type: String, default: "" },
    coverImagePublicId: { type: String, default: "" },
    isOpen: {
      type: Boolean,
      default: true,
    },
    // Existing restaurants remain approved by default; new registrations explicitly set false.
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const restaurantModel = mongoose.model(
  "Restaurant",
  restaurantSchema
);

export default restaurantModel;