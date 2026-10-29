import bcrypt from "bcrypt";
import deliveryModel from "../models/deliveryModel.js";
import generateToken from "../utils/jwtutils.js";
import orderModel from "../models/orderModel.js";
import sendEmail from "../utils/emailUtils.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";



export const addDelivery = async (req, res) => {
    try {
        const {
            deliveryName,
            email,
            phone,
            address,
            password,
        } = req.body;

        // Validate required fields
        if (
            typeof deliveryName !== "string" ||
            !deliveryName.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof phone !== "string" ||
            !phone.trim() ||
            typeof address !== "string" ||
            !address.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                message: "All fields are required",
                status: 0,
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address",
                status: 0,
            });
        }

        // Validate phone
        if (!/^\d{10}$/.test(phone.trim())) {
            return res.status(400).json({
                message: "Phone number must contain exactly 10 digits",
                status: 0,
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long",
                status: 0,
            });
        }

        // Check duplicate email
        const existingDelivery = await deliveryModel.findOne({
            email: normalizedEmail,
        });

        if (existingDelivery) {
            return res.status(409).json({
                message: "Delivery person email already registered",
                status: 0,
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create account awaiting approval
        const saveDelivery = await deliveryModel.create({
            deliveryName: deliveryName.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            address: address.trim(),
            password: hashedPassword,
            isActive: false,
            isApproved: false,
        });

        await sendEmail({
            to: normalizedEmail,
            name: deliveryName.trim(),
            subject: "WebBites delivery partner registration received",
            message: "We have received your delivery partner registration. Your account is pending admin review. You will receive another email when your account is approved or if its status changes.",
            details: [
                { label: "Name", value: deliveryName.trim() },
                { label: "Status", value: "Pending admin approval" },
            ],
        });

        return res.status(201).json({
            message: "Registration successful! Your account is awaiting admin approval.",
            status: 1,
            data: {
                id: saveDelivery._id,
                deliveryName: saveDelivery.deliveryName,
                email: saveDelivery.email,
                phone: saveDelivery.phone,
                address: saveDelivery.address,
                isActive: saveDelivery.isActive,
                isApproved: saveDelivery.isApproved,
            },
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Delivery person email already registered",
                status: 0,
            });
        }

        console.error("Delivery registration error:", error);

        return res.status(500).json({
            message: "Failed to register delivery partner",
            status: 0,
        });
    }
};



export const deliveryLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required",
                status: 0,
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Find delivery partner
        const delivery = await deliveryModel.findOne({
            email: normalizedEmail,
        });

        if (!delivery) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: 0,
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(
            password,
            delivery.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: 0,
            });
        }

        // Distinguish new registrations waiting for approval from previously approved accounts.
        if (!delivery.isApproved) {
            return res.status(403).json({
                message: "Your delivery partner registration is awaiting admin approval. We will email you when your account is approved.",
                status: 0,
                approvalPending: true,
            });
        }

        if (!delivery.isActive) {
            return res.status(403).json({
                message: "Your delivery account is currently deactivated. Please contact support.",
                status: 0,
            });
        }

        // Generate token
        const token = generateToken(delivery, "delivery");

        return res.status(200).json({
            message: "Delivery login successful",
            status: 1,
            data: {
                id: delivery._id,
                deliveryName: delivery.deliveryName,
                email: delivery.email,
                phone: delivery.phone,
                address: delivery.address,
            },
            token,
        });

    } catch (error) {
        console.error("Delivery login error:", error);

        return res.status(500).json({
            message: "Delivery login failed",
            status: 0,
        });
    }
};


export const acceptDelivery = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (
            typeof orderId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(orderId)
        ) {
            return res.status(400).json({
                message: "Invalid order ID",
                status: 0,
            });
        }

        const order = await orderModel.findOneAndUpdate(
            {
                _id: orderId,
                status: "Out for Delivery",
                deliveryId: null,
            },
            {
                deliveryId: req.user.id,
            },
            {
                new: true,
            }
        );

        if (!order) {
            return res.status(404).json({
                message: "Order is already assigned or not available",
                status: 0,
            });
        }

        return res.status(200).json({
            message: "Delivery accepted successfully",
            status: 1,
            data: order,
        });

    } catch (error) {
        console.error("Accept delivery error:", error);

        return res.status(500).json({
            message: "Failed to accept delivery",
            status: 0,
        });
    }
};




export const completeDelivery = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { otp } = req.body || {};

        if (typeof orderId !== "string" || !/^[a-fA-F0-9]{24}$/.test(orderId)) {
            return res.status(400).json({ message: "Invalid order ID", status: 0 });
        }

        const order = await orderModel.findOne({
            _id: orderId,
            deliveryId: req.user.id,
            status: "Out for Delivery",
        }).select("+deliveryOtpHash +deliveryOtpExpiresAt");

        if (!order) {
            return res.status(404).json({
                message: "Order not found, not assigned to you, or not available for delivery",
                status: 0,
            });
        }

        if (order.deliveryDeadlineAt && order.deliveryDeadlineAt <= new Date()) {
            const reason = "This order was automatically cancelled because it was not delivered within 1 hour after being marked Out for Delivery.";
            order.status = "Cancelled";
            order.cancellationReason = reason;
            order.cancelledAt = new Date();
            order.deliveryOtpHash = null;
            order.deliveryOtpExpiresAt = null;
            await order.save();
            try {
                const customerOrder = await orderModel.findById(order._id).populate("customerId", "name email");
                if (customerOrder?.customerId?.email) {
                    let message = `${reason} Order ID: ${order._id}. Please contact WebBites support if you need assistance.`;
                    if (order.paymentMethod === "Online" && order.paymentStatus === "Paid") {
                        message += " Your online payment was already recorded; please contact WebBites support regarding the refund.";
                    }
                    await sendEmail({ to: customerOrder.customerId.email, name: customerOrder.customerId.name || "Customer", subject: "Order Cancelled - Delivery Time Limit Exceeded", message });
                }
            } catch (emailError) {
                console.error("Delivery timeout email failed:", emailError.message);
            }
            return res.status(400).json({ message: `${reason} The order has now been cancelled.`, status: 0, data: order });
        }

        if (order.paymentMethod === "Online") {
            if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
                return res.status(400).json({ message: "Enter the 6-digit customer delivery OTP.", status: 0 });
            }
            if (!order.deliveryOtpHash || !order.deliveryOtpExpiresAt || order.deliveryOtpExpiresAt < new Date()) {
                return res.status(400).json({ message: "Delivery OTP is missing or expired. Ask the customer to contact support.", status: 0 });
            }
            const submittedHash = crypto.createHash("sha256").update(otp).digest("hex");
            const expected = Buffer.from(order.deliveryOtpHash, "hex");
            const submitted = Buffer.from(submittedHash, "hex");
            if (expected.length !== submitted.length || !crypto.timingSafeEqual(expected, submitted)) {
                return res.status(400).json({ message: "Incorrect delivery OTP. Please check with the customer.", status: 0 });
            }
        }

        order.status = "Delivered";
        order.deliveryOtpHash = null;
        order.deliveryOtpExpiresAt = null;
        await order.save();

        try {
            const customerOrder = await orderModel.findById(order._id).populate("customerId", "name email");
            if (customerOrder?.customerId?.email) {
                await sendEmail({
                    to: customerOrder.customerId.email,
                    name: customerOrder.customerId.name || "Customer",
                    subject: "Order Delivered - WebBites",
                    message: `Your order #${order._id} has been delivered successfully. Thank you for choosing WebBites!`,
                });
            }
        } catch (emailError) {
            console.error("Delivery confirmation email failed:", emailError.message);
        }

        return res.status(200).json({ message: "Order delivered successfully", status: 1, data: order });
    } catch (error) {
        console.error("Complete delivery error:", error);
        return res.status(500).json({ message: "Failed to complete delivery", status: 0 });
    }
};


export const getMyDeliveries = async (req, res) => {
    try {
       
        const orders = await orderModel
            .find({
                deliveryId: req.user.id,
                status: { $ne: "Cancelled" },
            })
            .populate("customerId", "name email phone")
            .populate("restaurantId", "restaurantName address")
            .sort({ createdAt: -1 });



        res.status(200).json({
            message: "My deliveries fetched successfully",
            status: 1,
            data: orders,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: 0,
        });
    }
};

export const getDeliveryProfile = async (req, res) => {
  try {
    const delivery = await deliveryModel
      .findById(req.user.id)
      .select("-password");

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery partner not found",
        status: 0,
      });
    }

    res.status(200).json({
      message: "Delivery profile fetched successfully",
      status: 1,
      data: delivery,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch delivery profile",
      status: 0,
    });
  }
};



export const updateDeliveryProfile = async (req, res) => {
    try {
        const { deliveryName, phone, address } = req.body;

        // Validate authenticated delivery partner ID
        if (
            typeof req.user?.id !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(req.user.id)
        ) {
            return res.status(401).json({
                message: "Invalid authentication",
                status: 0,
            });
        }

        // Validate required fields
        if (
            typeof deliveryName !== "string" ||
            !deliveryName.trim() ||
            typeof phone !== "string" ||
            !phone.trim() ||
            typeof address !== "string" ||
            !address.trim()
        ) {
            return res.status(400).json({
                message: "All fields are required",
                status: 0,
            });
        }

        const cleanName = deliveryName.trim();
        const cleanPhone = phone.trim();
        const cleanAddress = address.trim();

        // Validate phone number
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                message: "Phone number must contain exactly 10 digits",
                status: 0,
            });
        }

        // Update only the authenticated delivery partner's allowed fields
        const delivery = await deliveryModel.findOneAndUpdate(
            { _id: req.user.id },
            {
                $set: {
                    deliveryName: cleanName,
                    phone: cleanPhone,
                    address: cleanAddress,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!delivery) {
            return res.status(404).json({
                message: "Delivery partner not found",
                status: 0,
            });
        }

        return res.status(200).json({
            message: "Delivery profile updated successfully",
            status: 1,
            data: delivery,
        });
    } catch (error) {
        console.error("Update delivery profile error:", error);

        return res.status(500).json({
            message: "Failed to update delivery profile",
            status: 0,
        });
    }
};





export const getDeliveryEarnings = async (req, res) => {
  try {
    const orders = await orderModel.find({
      deliveryId: req.user.id,
      status: "Delivered",
    });

    const deliveryCharge = 30;

    const totalDeliveries = orders.length;
    const totalEarnings = totalDeliveries * deliveryCharge;

    res.status(200).json({
      message: "Delivery earnings fetched successfully",
      status: 1,
      data: {
        totalDeliveries,
        deliveryCharge,
        totalEarnings,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch delivery earnings",
      status: 0,
    });
  }
};
export const getDeliveryInfo = async (req, res) => {
  try {
    const deliveryId = req.user.id;

    // Get delivery partner information
    const delivery = await deliveryModel
      .findById(deliveryId)
      .select("-password");

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery partner not found",
        status: 0,
      });
    }

    // Get all delivered orders assigned to this delivery partner
    const orders = await orderModel
      .find({ deliveryId })
      .populate("customerId", "name email")
      .populate("restaurantId", "restaurantName address")
      .sort({ createdAt: -1 });

    // Completed deliveries
    const completedOrders = orders.filter(
      (order) => order.status === "Delivered"
    );

    // Active deliveries
    const activeOrders = orders.filter(
      (order) => order.status === "Out for Delivery"
    );

    // Pending available orders
    const availableOrders = await orderModel.countDocuments({
      status: "Out for Delivery",
      deliveryId: null,
    });

    // Delivery earnings
    const deliveryCharge = 30;

    const totalEarnings =
      completedOrders.length * deliveryCharge;

    // Recent deliveries
    const recentOrders = orders.slice(0, 5).map((order) => ({
      _id: order._id,
      customerName: order.customerId?.name || "Customer",
      restaurantName:
        order.restaurantId?.restaurantName || "Restaurant",
      deliveryAddress: order.deliveryAddress,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
    }));

    res.status(200).json({
      message: "Delivery information fetched successfully",
      status: 1,
      data: {
        delivery: {
          _id: delivery._id,
          deliveryName: delivery.deliveryName,
          email: delivery.email,
          phone: delivery.phone,
          address: delivery.address,
        },

        stats: {
          completedDeliveries: completedOrders.length,
          activeDeliveries: activeOrders.length,
          availableOrders,
          deliveryCharge,
          totalEarnings,
        },

        recentOrders,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch delivery information",
      status: 0,
    });
  }
};

export const updateDeliveryProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please choose an image", status: 0 });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: "Profile picture storage is not configured", status: 0 });
    }
    const current = await deliveryModel.findById(req.user.id).select("profilePicturePublicId");
    if (!current) return res.status(404).json({ message: "Delivery partner not found", status: 0 });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "webbites/profiles/delivery", resource_type: "image", transformation: [{ width: 500, height: 500, crop: "limit" }] }, (error, uploaded) => error ? reject(error) : resolve(uploaded));
      stream.end(req.file.buffer);
    });
    const updated = await deliveryModel.findByIdAndUpdate(req.user.id, { $set: { profilePicture: result.secure_url, profilePicturePublicId: result.public_id } }, { new: true }).select("-password");
    if (current.profilePicturePublicId) cloudinary.uploader.destroy(current.profilePicturePublicId).catch((error) => console.error("Old delivery picture cleanup failed:", error.message));
    return res.status(200).json({ message: "Profile picture updated successfully", status: 1, data: updated });
  } catch (error) {
    console.error("Delivery profile picture upload error:", error.message);
    return res.status(500).json({ message: "Failed to upload profile picture", status: 0 });
  }
};
