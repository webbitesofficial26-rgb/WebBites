import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
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
      default: "",
      trim: true,
    },
    addresses: [{
      label: { type: String, trim: true, default: "Home" },
      address: { type: String, trim: true, required: true },
      isDefault: { type: Boolean, default: false },
    }],
    profilePicture: { type: String, default: "" },
    profilePicturePublicId: { type: String, default: "" },

    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },

    resetPasswordExpires: {
        type: Date,
        default: null,
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("User", userSchema);

export default userModel;