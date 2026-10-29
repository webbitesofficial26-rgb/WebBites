import crypto from "crypto";
import bcrypt from "bcrypt";
import restaurantModel from "../models/RestaurantModel.js";
import deliveryModel from "../models/deliveryModel.js";
import sendEmail from "../utils/emailUtils.js";

const accountModels = {
  restaurant: { model: restaurantModel, nameField: "restaurantName", label: "restaurant" },
  delivery: { model: deliveryModel, nameField: "deliveryName", label: "delivery partner" },
};

const getAccountType = (value) => accountModels[String(value || "").toLowerCase()];

export const forgotAccountPassword = async (req, res) => {
  try {
    const accountType = getAccountType(req.params.accountType);
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!accountType) return res.status(400).json({ status: 0, message: "Choose restaurant or delivery account." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ status: 0, message: "Enter a valid email address." });

    const response = { status: 1, message: "If an account exists with that email, a password reset link will be sent." };
    const account = await accountType.model.findOne({ email });
    if (!account) return res.status(200).json(response);

    const token = crypto.randomBytes(32).toString("hex");
    account.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    account.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await account.save();

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      account.resetPasswordToken = null;
      account.resetPasswordExpires = null;
      await account.save();
      return res.status(500).json({ status: 0, message: "Password reset is temporarily unavailable. Please contact support." });
    }

    const actionUrl = `${frontendUrl.replace(/\/$/, "")}/reset-account-password/${req.params.accountType.toLowerCase()}/${token}`;
    const sent = await sendEmail({
      to: account.email,
      name: account[accountType.nameField] || accountType.label,
      subject: "Reset your WebBites password",
      message: "We received a request to reset your WebBites password. This link expires in 15 minutes. If you did not request this, you can ignore this email.",
      actionUrl,
      actionText: "Reset Password",
    });

    if (!sent) {
      account.resetPasswordToken = null;
      account.resetPasswordExpires = null;
      await account.save();
      return res.status(503).json({ status: 0, message: "We couldn't send the reset email. Please try again later." });
    }
    return res.status(200).json(response);
  } catch (error) {
    console.error("Account forgot-password error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to process the password reset request." });
  }
};

export const resetAccountPassword = async (req, res) => {
  try {
    const accountType = getAccountType(req.params.accountType);
    const { token } = req.params;
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!accountType) return res.status(400).json({ status: 0, message: "Invalid account type." });
    if (password.length < 8) return res.status(400).json({ status: 0, message: "Password must contain at least 8 characters." });

    const hashedToken = crypto.createHash("sha256").update(String(token || "")).digest("hex");
    const account = await accountType.model.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!account) return res.status(400).json({ status: 0, message: "This reset link is invalid or has expired. Please request a new one." });

    account.password = await bcrypt.hash(password, 10);
    account.resetPasswordToken = null;
    account.resetPasswordExpires = null;
    await account.save();
    return res.status(200).json({ status: 1, message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    console.error("Account reset-password error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to reset password. Please try again." });
  }
};

export const changeAccountPassword = async (req, res) => {
  try {
    const accountType = getAccountType(req.user?.role);
    if (!accountType || !req.user?.id) return res.status(403).json({ status: 0, message: "Only restaurant and delivery accounts can change passwords here." });
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    const confirmPassword = typeof req.body?.confirmPassword === "string" ? req.body.confirmPassword : "";
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ status: 0, message: "Complete all password fields." });
    if (newPassword.length < 8) return res.status(400).json({ status: 0, message: "New password must contain at least 8 characters." });
    if (newPassword !== confirmPassword) return res.status(400).json({ status: 0, message: "New password and confirmation do not match." });
    if (currentPassword === newPassword) return res.status(400).json({ status: 0, message: "Choose a new password different from your current password." });

    const account = await accountType.model.findById(req.user.id);
    if (!account) return res.status(404).json({ status: 0, message: "Account not found. Please log in again." });
    const matches = await bcrypt.compare(currentPassword, account.password);
    if (!matches) return res.status(400).json({ status: 0, message: "Current password is incorrect." });
    account.password = await bcrypt.hash(newPassword, 10);
    account.resetPasswordToken = null;
    account.resetPasswordExpires = null;
    await account.save();
    return res.status(200).json({ status: 1, message: "Password updated successfully." });
  } catch (error) {
    console.error("Account change-password error:", error.message);
    return res.status(500).json({ status: 0, message: "Unable to update password. Please try again." });
  }
};
