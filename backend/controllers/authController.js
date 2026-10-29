import userData from '../models/User.js';
import bcrypt from 'bcrypt';
import generateToken from '../utils/jwtutils.js';
import sendEmail from '../utils/emailUtils.js';
import crypto from "crypto";

export const addUser = async (req, res) => {
    try {
        let { name, email, phone, password } = req.body;

        // Check required fields
        if (
            !name?.trim() ||
            !email?.trim() ||
            !phone?.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "All fields are required",
                status: 0,
            });
        }

        // Normalize input
        name = name.trim();
        email = email.trim().toLowerCase();
        phone = phone.trim();

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address",
                status: 0,
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters",
                status: 0,
            });
        }

        // Check phone number format (10 digits)
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                message: "Please enter a valid 10-digit phone number",
                status: 0,
            });
        }

        // Check for an existing account
        const existingUser = await userData.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered",
                status: 0,
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const saveUser = await userData.create({
            name,
            email,
            phone,
            password: hashedPassword,
        });

        // Send welcome email without blocking registration
        void sendEmail({
            to: saveUser.email,
            name: saveUser.name,
            subject: "Welcome to WebBites!",
            message: `Welcome to WebBites, ${saveUser.name}! Your account has been created successfully. You can now explore restaurants and order your favourite food.`,
        });

        // Never return the password
        return res.status(201).json({
            message: "Registration successful!",
            status: 1,
            data: {
                _id: saveUser._id,
                name: saveUser.name,
                email: saveUser.email,
                phone: saveUser.phone,
            },
        });

    } catch (error) {
        // Handle duplicate email race conditions
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered",
                status: 0,
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Registration failed",
            status: 0,
        });
    }
};




export const login = async (req, res) => {
    try {
        const email = typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";
        const password = typeof req.body?.password === "string"
            ? req.body.password
            : "";

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
                status: 0,
            });
        }

        const user = await userData.findOne({ email });
        if (!user) {
            return res.status(200).json({
                message: "Invalid email or password",
                status: 0,
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(200).json({
                message: "Invalid email or password",
                status: 0,
            });
        }

        const token = generateToken(user, "customer");

        // Never send the password hash or reset-token fields to the client.
        return res.status(200).json({
            message: "Login successful",
            status: 1,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address || "",
            },
            token,
        });
    } catch (error) {
        console.error("Customer login error:", error.message);
        return res.status(500).json({
            message: "Login failed. Please try again.",
            status: 0,
        });
    }
};


export const forgetPassword = async (req, res) => {
    try {
        const email = typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                status: 0,
            });
        }

        const user = await userData.findOne({ email });

        // Use the same response whether the account exists or not.
        const response = {
            message: "If an account exists with that email, a reset link will be sent.",
            status: 1,
        };

        if (!user) {
            return res.status(200).json(response);
        }

        // Generate a cryptographically secure reset token.
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Store only the hash of the token in MongoDB.
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Token expires in 15 minutes.
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        await user.save();

        // Configure the frontend URL in your backend .env.
        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
            // Remove the token if the reset link cannot be configured.
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();

            console.error("FRONTEND_URL is not configured");

            return res.status(500).json({
                message: "Password reset is temporarily unavailable",
                status: 0,
            });
        }

        const resetLink =
            `${frontendUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

        // Send the reset email.
        const emailSent = await sendEmail({
            to: user.email,
            name: user.name,
            subject: "Reset Your WebBites Password",
            message: "We received a request to reset your WebBites password. This link expires in 15 minutes. If you did not request a reset, you can ignore this email.",
            actionUrl: resetLink,
            actionText: "Reset My Password",
        });

        // Do not leave a usable reset token behind if the email service fails.
        // Keep the same public response to avoid revealing whether an account exists.
        if (!emailSent) {
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            message: "Unable to process password reset",
            status: 0,
        });
    }
};

export const profile = async (req, res) => {
    res.status(200).json({
        message: "Protected route working",
        status: 1,
        user: req.user,
    });
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                message: "Token and new password are required",
                status: 0,
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters",
                status: 0,
            });
        }

        // Hash the received token to match the stored hash.
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await userData.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: "Reset link is invalid or has expired",
                status: 0,
            });
        }

        // Hash the new password.
        user.password = await bcrypt.hash(password, 10);

        // Invalidate the token so it cannot be reused.
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully. Please log in with your new password.",
            status: 1,
        });

    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            message: "Unable to reset password",
            status: 0,
        });
    }
};