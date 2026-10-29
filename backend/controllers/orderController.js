import orderModel from "../models/orderModel.js";
import restaurantModel from "../models/RestaurantModel.js";
import productModel from "../models/productModel.js";
import sendEmail from "../utils/emailUtils.js";
import razorpay, { isRazorpayConfigured } from "../config/razorpay.js";
import crypto from "crypto";
import mongoose from "mongoose";
import paymentAttemptModel from "../models/paymentAttemptModel.js";
import couponModel from "../models/couponModel.js";
import RestaurantOffer from "../models/RestaurantOfferModel.js";
import OfferTemplate from "../models/OfferTemplateModel.js";
import autoAssignDelivery from "../utils/autoAssignDelivery.js";


const calculateCouponDiscount = async (couponCode, subtotalAmount) => {
    // No coupon applied
    if (!couponCode || !couponCode.trim()) {
        return {
            coupon: null,
            couponCode: null,
            subtotalAmount,
            discountAmount: 0,
            totalAmount: subtotalAmount,
        };
    }

    const normalizedCode = couponCode.trim().toUpperCase();

    const coupon = await couponModel.findOne({
        code: normalizedCode,
    });

    if (!coupon || !coupon.isActive) {
        return { error: "Invalid or inactive coupon code" };
    }

    if (new Date(coupon.expiryDate) <= new Date()) {
        return { error: "This coupon has expired" };
    }

    if (
        coupon.usageLimit !== null &&
        coupon.usedCount >= coupon.usageLimit
    ) {
        return { error: "This coupon has reached its usage limit" };
    }

    if (subtotalAmount < coupon.minOrderAmount) {
        return {
            error: `Minimum order amount is ₹${coupon.minOrderAmount}`,
        };
    }

    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
        discountAmount =
            (subtotalAmount * coupon.discountValue) / 100;

        if (coupon.maxDiscount !== null) {
            discountAmount = Math.min(
                discountAmount,
                coupon.maxDiscount
            );
        }
    } else {
        discountAmount = coupon.discountValue;
    }

    discountAmount = Math.round(
        Math.min(discountAmount, subtotalAmount) * 100
    ) / 100;

    const totalAmount = Math.round(
        (subtotalAmount - discountAmount) * 100
    ) / 100;

    return {
        coupon,
        couponCode: coupon.code,
        subtotalAmount,
        discountAmount,
        totalAmount,
    };
};


const calculateRestaurantOfferDiscount = async (restaurantOfferId, restaurantId, subtotalAmount) => {
    if (!restaurantOfferId) return { restaurantOffer: null, restaurantOfferId: null, restaurantOfferName: null, discountAmount: 0, totalAmount: subtotalAmount };
    if (!mongoose.isValidObjectId(restaurantOfferId)) return { error: "Invalid restaurant offer." };
    const current = new Date();
    const participation = await RestaurantOffer.findOne({ _id: restaurantOfferId, restaurantId, isActive: true });
    if (!participation) return { error: "This offer is not active for the selected restaurant." };
    const template = await OfferTemplate.findOne({ _id: participation.offerTemplateId, isActive: true, startDate: { $lte: current }, expiryDate: { $gt: current } });
    if (!template) return { error: "This restaurant offer has expired or is unavailable." };
    if (subtotalAmount < Number(template.minOrderAmount || 0)) return { error: `Minimum order amount for this offer is ₹${template.minOrderAmount || 0}.` };
    let discountAmount = 0;
    if (template.discountType === "percentage") {
      discountAmount = subtotalAmount * Number(template.discountValue || 0) / 100;
      if (template.maxDiscount != null) discountAmount = Math.min(discountAmount, Number(template.maxDiscount));
    } else if (template.discountType === "fixed") {
      discountAmount = Number(template.discountValue || 0);
    }
    // The current order model has no separate delivery-fee amount, so free-delivery offers do not reduce the food subtotal.
    discountAmount = Math.round(Math.min(Math.max(0, discountAmount), subtotalAmount) * 100) / 100;
    return { restaurantOffer: participation, restaurantOfferId: participation._id, restaurantOfferName: template.name, discountAmount, totalAmount: Math.round((subtotalAmount - discountAmount) * 100) / 100 };
};

export const createRazorpayOrder = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        message: "Online payments are not configured. Please use Cash on Delivery or try again later.",
        status: 0,
      });
    }

    const { restaurantId, items, deliveryAddress, couponCode, restaurantOfferId } = req.body;

    if (
      !restaurantId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50 ||
      typeof deliveryAddress !== "string" ||
      !deliveryAddress.trim()
    ) {
      return res.status(400).json({
        message: "Invalid or missing checkout details",
        status: 0,
      });
    }

    const totalRequestedItems = items.reduce(
      (total, item) => total + (Number.isSafeInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 0),
      0
    );
    if (totalRequestedItems > 20) {
      return res.status(400).json({
        message: "A maximum of 20 items can be placed in one order.",
        status: 0,
      });
    }

    const restaurant = await restaurantModel.findById(restaurantId);

    if (!restaurant || !restaurant.isOpen) {
      return res.status(400).json({
        message: "Restaurant is unavailable or closed",
        status: 0,
      });
    }

    const verifiedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (
        !item.productId ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return res.status(400).json({
          message: "Invalid product or quantity",
          status: 0,
        });
      }

      const product = await productModel.findOne({
        _id: item.productId,
        restaurantId: restaurant._id,
        available: true,
      });

      if (!product) {
        return res.status(400).json({
          message: "A product is unavailable or invalid",
          status: 0,
        });
      }

      const price = Number(product.price);
      const subtotal = price * item.quantity;

      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isFinite(subtotal)
      ) {
        return res.status(400).json({
          message: "Invalid product price",
          status: 0,
        });
      }

      verifiedItems.push({
        productId: product._id,
        productName: product.productName,
        price,
        quantity: item.quantity,
        subtotal,
      });

      totalAmount += subtotal;
    }


    if (
        !Number.isFinite(totalAmount) ||
        totalAmount <= 0 ||
        !Number.isSafeInteger(Math.round(totalAmount * 100))
    ) {
        return res.status(400).json({
            message: "Invalid order total",
            status: 0,
        });
    }

    if (restaurantOfferId && couponCode) {
      return res.status(400).json({ status: 0, message: "Use either a coupon code or a restaurant offer, not both." });
    }
    const pricingResult = restaurantOfferId
      ? await calculateRestaurantOfferDiscount(restaurantOfferId, restaurant._id, totalAmount)
      : await calculateCouponDiscount(couponCode, totalAmount);
    if (pricingResult.error) return res.status(400).json({ message: pricingResult.error, status: 0 });
    const subtotalAmount = pricingResult.subtotalAmount ?? totalAmount;
    const discountAmount = pricingResult.discountAmount;
    const finalAmount = pricingResult.totalAmount;
    const appliedCouponCode = pricingResult.couponCode || null;
    const appliedRestaurantOfferId = pricingResult.restaurantOfferId || null;
    const appliedRestaurantOfferName = pricingResult.restaurantOfferName || null;

    // Create the Razorpay order using the discounted amount.
    const paymentOrder = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100),
        currency: "INR",
        receipt: `wb_${Date.now()}`,
    });



    // Save server-verified checkout details against the Razorpay order.
   
    await paymentAttemptModel.create({
        customerId: req.user.id,
        restaurantId: restaurant._id,
        items: verifiedItems,
        subtotalAmount,
        discountAmount,
        couponCode: appliedCouponCode,
        restaurantOfferId: appliedRestaurantOfferId,
        restaurantOfferName: appliedRestaurantOfferName,
        totalAmount: finalAmount,
        deliveryAddress: deliveryAddress.trim(),
        razorpayOrderId: paymentOrder.id,
        status: "Created",
    });



    return res.status(201).json({
      message: "Payment order created successfully",
      status: 1,
      data: {
        razorpayOrderId: paymentOrder.id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error.message);

    return res.status(500).json({
      message: "Failed to create payment order",
      status: 0,
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        message: "Online payment verification is not configured.",
        status: 0,
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Required payment details are missing",
        status: 0,
      });
    }

    // Verify the Razorpay signature.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
      return res.status(400).json({
        message: "Invalid payment signature",
        status: 0,
      });
    }

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        message: "Payment verification failed",
        status: 0,
      });
    }

    // Find the saved checkout belonging to this customer.
    const attempt = await paymentAttemptModel.findOne({
      razorpayOrderId: razorpay_order_id,
      customerId: req.user.id,
    });

    if (!attempt) {
      return res.status(404).json({
        message: "Payment checkout not found",
        status: 0,
      });
    }

    // If this checkout already created an order, return that order.
    if (attempt.orderId) {
      const existingOrder = await orderModel.findById(attempt.orderId);

      if (existingOrder) {
        return res.status(200).json({
          message: "Order already created for this payment",
          status: 1,
          data: existingOrder,
        });
      }
    }

    if (attempt.status !== "Created") {
      return res.status(409).json({
        message: "This payment attempt has already been processed",
        status: 0,
      });
    }

    // Fetch payment details directly from Razorpay.
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      payment.amount !== Math.round(attempt.totalAmount * 100)
    ) {
      return res.status(400).json({
        message: "Payment is unsuccessful or the amount does not match",
        status: 0,
      });
    }

    // Prevent reuse of a payment already attached to another order.
    const existingPayment = await orderModel.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingPayment) {
      return res.status(409).json({
        message: "This payment has already been used",
        status: 0,
      });
    }

    // Use the saved checkout details, not details supplied by React.
   
    const deliveryOtp = String(crypto.randomInt(100000, 1000000));
    const order = await orderModel.create({
        customerId: attempt.customerId,
        deliveryOtpHash: crypto.createHash("sha256").update(deliveryOtp).digest("hex"),
        deliveryOtpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        restaurantId: attempt.restaurantId,
        items: attempt.items,
        subtotalAmount: attempt.subtotalAmount,
        discountAmount: attempt.discountAmount,
        couponCode: attempt.couponCode,
        restaurantOfferId: attempt.restaurantOfferId,
        restaurantOfferName: attempt.restaurantOfferName,
        totalAmount: attempt.totalAmount,
        deliveryAddress: attempt.deliveryAddress,
        paymentMethod: "Online",
        paymentStatus: "Paid",
        razorpayOrderId: attempt.razorpayOrderId,
        razorpayPaymentId: razorpay_payment_id,
    });



    // Record successful processing for repeat verification requests.
    attempt.status = "Paid";
    attempt.razorpayPaymentId = razorpay_payment_id;
    attempt.orderId = order._id;
    await attempt.save();

  
// Count coupon usage only after successful payment and order creation.
    if (attempt.couponCode) {
        await couponModel.updateOne(
            {
                code: attempt.couponCode,
                isActive: true,
                $or: [
                    { usageLimit: null },
                    { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
                ],
            },
            {
                $inc: { usedCount: 1 },
            }
        );
    }



    // Email the delivery OTP only after Razorpay payment has been verified.
    try {
      const customer = await orderModel.findById(order._id).populate("customerId", "name email");
      if (customer?.customerId?.email) {
        await sendEmail({
          to: customer.customerId.email,
          name: customer.customerId.name || "Customer",
          subject: "Your WebBites Delivery OTP",
          message: `Your delivery verification OTP is ${deliveryOtp}. Share it with the delivery partner only when your order arrives. This OTP expires in 24 hours.`,
          details: [{ label: "Order ID", value: String(order._id) }],
        });
      }
    } catch (otpEmailError) {
      console.error("Delivery OTP email failed:", otpEmailError.message);
    }

    // Send the confirmation email without blocking the response.
    void notifyCustomer(order._id, "Pending");

    return res.status(201).json({
      message: "Payment verified and order placed successfully",
      status: 1,
      data: order,
    });
  } catch (error) {
    console.error("Razorpay payment verification error:", error.message);

    return res.status(500).json({
      message: "Unable to verify payment and create order",
      status: 0,
    });
  }
};

const notifyCustomer = async (orderId, status) => {
    try {
        const order = await orderModel
            .findById(orderId)
            .populate("customerId", "name email")
            .populate("restaurantId", "restaurantName");

        if (!order || !order.customerId?.email) {
            console.log("Customer email not found for order:", orderId);
            return;
        }

        const messages = {
            Pending: {
                subject: "Order Confirmation - WebBites",
                message: "Your order has been placed successfully.",
            },

            Accepted: {
                subject: "Order Accepted - WebBites",
                message: "The restaurant has accepted your order.",
            },

            Preparing: {
                subject: "Food Preparation Started - WebBites",
                message: "The restaurant has started preparing your food.",
            },

            "Out for Delivery": {
                subject: "Your Order Is On Its Way - WebBites",
                message: "Your order is out for delivery.",
            },

            Delivered: {
                subject: "Order Delivered - WebBites",
                message: "Your order has been delivered successfully.",
            },

            Cancelled: {
                subject: "Order Cancelled - WebBites",
                message: order.cancellationReason || "Your order has been cancelled.",
            },
        };

        const notification = messages[status];

        if (!notification) {
            return;
        }

        // Add order details to the confirmation email.
        const details = status === "Pending"
            ? [
                {
                    label: "Order ID",
                    value: order._id,
                },
                {
                    label: "Restaurant",
                    value: order.restaurantId?.restaurantName || "Restaurant",
                },
                ...order.items.map((item) => ({
                    label: `${item.productName} × ${item.quantity}`,
                    value: `₹${item.subtotal}`,
                })),
                {
                    label: "Total Amount",
                    value: `₹${order.totalAmount}`,
                },
                {
                    label: "Delivery Address",
                    value: order.deliveryAddress,
                },
            ]
            : [
                {
                    label: "Order ID",
                    value: order._id,
                },
                {
                    label: "Restaurant",
                    value: order.restaurantId?.restaurantName || "Restaurant",
                },
                {
                    label: "Order Status",
                    value: status,
                },
            ];

        await sendEmail({
            to: order.customerId.email,
            name: order.customerId.name || "Customer",
            subject: notification.subject,
            message: notification.message,
            details,
        });

    } catch (error) {
        console.error("Order notification error:", error.message);
    }
};

export const createOrder = async (req, res) => {
    try {
        const {
            restaurantId,
            items,
            deliveryAddress,
            couponCode,
            restaurantOfferId,
        } = req.body;

        // Validate required fields
        if (
            !restaurantId ||
            !Array.isArray(items) ||
            items.length === 0 ||
            typeof deliveryAddress !== "string" ||
            !deliveryAddress.trim()
        ) {
            return res.status(400).json({
                message: "Required order details are missing",
                status: 0,
            });
        }

        // Prevent excessively large orders
        if (items.length > 50) {
            return res.status(400).json({
                message: "Too many items in one order",
                status: 0,
            });
        }

        // Check restaurant
        const totalRequestedItems = items.reduce(
      (total, item) => total + (Number.isSafeInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 0),
      0
    );
    if (totalRequestedItems > 20) {
      return res.status(400).json({
        message: "A maximum of 20 items can be placed in one order.",
        status: 0,
      });
    }

    const restaurant = await restaurantModel.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                message: "Restaurant not found",
                status: 0,
            });
        }

        if (!restaurant.isOpen) {
            return res.status(400).json({
                message: "Restaurant is currently closed",
                status: 0,
            });
        }

        const orderItems = [];
        let totalAmount = 0;

        // Validate each item using database values
        for (const item of items) {
            if (
                !item.productId ||
                !Number.isSafeInteger(item.quantity) ||
                item.quantity < 1 ||
                item.quantity > 100
            ) {
                return res.status(400).json({
                    message: "Invalid product or quantity",
                    status: 0,
                });
            }

            // Product must belong to the selected restaurant
            const product = await productModel.findOne({
                _id: item.productId,
                restaurantId: restaurantId,
            });

            if (!product) {
                return res.status(400).json({
                    message: "A product does not belong to this restaurant",
                    status: 0,
                });
            }

            if (!product.available) {
                return res.status(400).json({
                    message: `${product.productName} is currently unavailable`,
                    status: 0,
                });
            }

            // Use the database price, not the frontend price
            const price = Number(product.price);
            const subtotal = price * item.quantity;

            if (
                !Number.isFinite(price) ||
                price <= 0 ||
                !Number.isFinite(subtotal)
            ) {
                return res.status(400).json({
                    message: "Invalid product price",
                    status: 0,
                });
            }

            orderItems.push({
                productId: product._id,
                productName: product.productName,
                price: price,
                quantity: item.quantity,
                subtotal: subtotal,
            });

            totalAmount += subtotal;
        }

        if (
            !Number.isFinite(totalAmount) ||
            totalAmount <= 0
        ) {
            return res.status(400).json({
                message: "Invalid order total",
                status: 0,
            });
        }

        if (restaurantOfferId && couponCode) {
            return res.status(400).json({ status: 400, message: "Use either a coupon code or a restaurant offer, not both." });
        }
        const pricingResult = restaurantOfferId
            ? await calculateRestaurantOfferDiscount(restaurantOfferId, restaurant._id, totalAmount)
            : await calculateCouponDiscount(couponCode, totalAmount);
        if (pricingResult.error) return res.status(400).json({ message: pricingResult.error, status: 0 });
        const subtotalAmount = pricingResult.subtotalAmount ?? totalAmount;
        const discountAmount = pricingResult.discountAmount;
        const finalAmount = pricingResult.totalAmount;
        const appliedCouponCode = pricingResult.couponCode || null;
        const coupon = pricingResult.coupon || null;
        const appliedRestaurantOfferId = pricingResult.restaurantOfferId || null;
        const appliedRestaurantOfferName = pricingResult.restaurantOfferName || null;

        // Create the COD order with the discounted total.
        const order = await orderModel.create({
            customerId: req.user.id,
            restaurantId: restaurant._id,
            items: orderItems,
            subtotalAmount,
            discountAmount,
            couponCode: appliedCouponCode,
            restaurantOfferId: appliedRestaurantOfferId,
            restaurantOfferName: appliedRestaurantOfferName,
            totalAmount: finalAmount,
            deliveryAddress: deliveryAddress.trim(),
        });

        // Increment coupon usage after successful order creation.
        if (coupon) {
            await couponModel.updateOne(
                {
                    _id: coupon._id,
                    isActive: true,
                    $or: [
                        { usageLimit: null },
                        { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
                    ],
                },
                {
                    $inc: { usedCount: 1 },
                }
            );
        }

        // Send confirmation email without blocking the response.
        void notifyCustomer(order._id, "Pending");

        return res.status(201).json({
            message: "Order placed successfully",
            status: 1,
            data: order,
        });



    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            message: "Failed to place order",
            status: 0,
        });
    }
};

export const getRestaurantOrders = async (req, res) => {
    try {
        const orders = await orderModel
            .find({
                restaurantId: req.user.id,
            })
            .populate("customerId", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Restaurant orders fetched successfully",
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


export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Find an order belonging to this restaurant
        const order = await orderModel.findOne({
            _id: orderId,
            restaurantId: req.user.id,
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                status: 0,
            });
        }

        // A restaurant cannot accept an order after the one-hour acceptance window.
        if (order.status === "Pending" && status === "Accepted" && Date.now() - new Date(order.createdAt).getTime() >= 60 * 60 * 1000) {
            const reason = "This order was automatically cancelled because the restaurant did not accept it within 1 hour.";
            order.status = "Cancelled";
            order.cancellationReason = reason;
            order.cancelledAt = new Date();
            await order.save();
            void notifyCustomer(order._id, "Cancelled");
            return res.status(400).json({
                message: `${reason} The order has now been cancelled.`,
                status: 0,
                data: order,
            });
        }

        // Allowed status transitions
        const allowedTransitions = {
            Pending: ["Accepted", "Cancelled"],
            Accepted: ["Preparing", "Cancelled"],
            Preparing: ["Out for Delivery", "Cancelled"],
            "Out for Delivery": [],
            Delivered: [],
            Cancelled: [],
        };

        if (order.status === status) {
            return res.status(400).json({
                message: "Order already has this status",
                status: 0,
            });
        }

        if (
            !allowedTransitions[order.status]?.includes(status)
        ) {
            return res.status(400).json({
                message: `Cannot change status from ${order.status} to ${status}`,
                status: 0,
            });
        }

        // Restaurant cannot mark orders as delivered
        if (status === "Delivered") {
            return res.status(400).json({
                message: "Only the assigned delivery partner can mark an order as delivered",
                status: 0,
            });
        }

        // Update order status
        order.status = status;
        if (status === "Out for Delivery") {
            // The one-hour delivery window starts when the restaurant dispatches the order.
            order.deliveryDeadlineAt = new Date(Date.now() + 60 * 60 * 1000);
        }
        if (status === "Cancelled") {
            order.cancellationReason = "The restaurant cancelled this order.";
            order.cancelledAt = new Date();
        }
        await order.save();

        // Automatically assign a free, approved delivery partner when dispatched.
        // If no partner is available, the order stays unassigned for manual acceptance.
        let autoAssignment = null;
        if (status === "Out for Delivery") {
            try {
                autoAssignment = await autoAssignDelivery(order._id);
                if (autoAssignment) order.deliveryId = autoAssignment.delivery._id;
            } catch (assignmentError) {
                console.error("Automatic delivery assignment failed:", assignmentError.message);
            }
        }

        // Notify customer without blocking the response
        void notifyCustomer(order._id, status);

        return res.status(200).json({
            message: status === "Out for Delivery"
                ? (autoAssignment
                    ? `Order marked Out for Delivery and assigned to ${autoAssignment.delivery.deliveryName}.`
                    : "Order marked Out for Delivery. No delivery partner is currently available, so it is waiting for a partner to accept it.")
                : "Order status updated successfully",
            status: 1,
            data: order,
        });

    } catch (error) {
        console.error("Restaurant order status error:", error);

        return res.status(500).json({
            message: "Failed to update order status",
            status: 0,
        });
    }
};



export const getDeliveryOrders = async (req, res) => {
    try {
        const orders = await orderModel
            .find({
                status: "Out for Delivery",
                deliveryId: null,
            })
            .populate("customerId", "name email phone")
            .populate("restaurantId", "restaurantName address")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Delivery orders fetched successfully",
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

export const getCustomerOrders = async (req, res) => {
    try {
        const orders = await orderModel
            .find({
                customerId: req.user.id,
            })
            .populate("restaurantId", "restaurantName address")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Customer orders fetched successfully",
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

export const cancelCustomerOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findOne({
      _id: orderId,
      customerId: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        status: 0,
      });
    }

    if (
      order.status !== "Pending" &&
      order.status !== "Accepted"
    ) {
      return res.status(400).json({
        message: "This order cannot be cancelled now",
        status: 0,
      });
    }

    order.status = "Cancelled";

    await order.save();
    void notifyCustomer(order._id, "Cancelled");
    res.status(200).json({
      message: "Order cancelled successfully",
      status: 1,
      data: order,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to cancel order",
      status: 0,
    });
  }
};

export const requestOrderReturn = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { returnReason } = req.body;

        if (
            typeof returnReason !== "string" ||
            !returnReason.trim()
        ) {
            return res.status(400).json({
                message: "Please provide a return reason",
                status: 0
            });
        }

        if (returnReason.trim().length > 500) {
            return res.status(400).json({
                message: "Return reason cannot exceed 500 characters",
                status: 0
            });
        }

        const order = await orderModel.findOne({
            _id: orderId,
            customerId: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                status: 0
            });
        }

        if (order.status !== "Delivered") {
            return res.status(400).json({
                message: "Only delivered orders can be returned",
                status: 0
            });
        }

        if (order.returnStatus !== "Not Requested") {
            return res.status(400).json({
                message: "A return request has already been submitted",
                status: 0
            });
        }

        order.returnStatus = "Return Requested";
        order.returnReason = returnReason.trim();
        order.returnRequestedAt = new Date();
        order.returnReviewedAt = null;
        order.returnAdminNote = "";

        await order.save();

        return res.status(200).json({
            message: "Return request submitted successfully",
            status: 1,
            data: order
        });

    } catch (error) {
        console.error("Return request error:", error);

        return res.status(500).json({
            message: "Failed to submit return request",
            status: 0
        });
    }
};

export const adminUpdateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Accepted",
            "Preparing",
            "Out for Delivery",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status",
                status: 0
            });
        }

        // Find the order
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                status: 0
            });
        }
        if (order.status === status) {
            return res.status(400).json({
                message: "Order already has this status",
                status: 0,
            });
        }

        // Do not allow changes to completed or cancelled orders
        if (
            order.status === "Delivered" ||
            order.status === "Cancelled"
        ) {
            return res.status(400).json({
                message: "Completed or cancelled orders cannot be updated",
                status: 0
            });
        }

        // Only allow the next valid status
        const allowedTransitions = {
            Pending: ["Accepted"],
            Accepted: ["Preparing"],
            Preparing: ["Out for Delivery"],
            "Out for Delivery": [],
            Delivered: [],
            Cancelled: []
        };

        // Delivery partner must handle delivery completion
        if (status === "Delivered") {
            return res.status(400).json({
                message: "Only the assigned delivery partner can mark an order as delivered",
                status: 0
            });
        }

        // Admin can cancel orders before they go out for delivery
        if (status === "Cancelled") {
            if (
                !["Pending", "Accepted", "Preparing"].includes(order.status)
            ) {
                return res.status(400).json({
                    message: "This order cannot be cancelled at its current stage",
                    status: 0
                });
            }

            order.status = "Cancelled";
            await order.save();
            void notifyCustomer(order._id, "Cancelled");
            return res.status(200).json({
                message: "Order cancelled successfully",
                status: 1,
                data: order
            });
        }

        // Validate normal status transitions
        if (!allowedTransitions[order.status]?.includes(status)) {
            return res.status(400).json({
                message: `Cannot change status from ${order.status} to ${status}`,
                status: 0
            });
        }

        order.status = status;
        if (status === "Out for Delivery") {
            order.deliveryDeadlineAt = new Date(Date.now() + 60 * 60 * 1000);
        }
        await order.save();

        let autoAssignment = null;
        if (status === "Out for Delivery") {
            try {
                autoAssignment = await autoAssignDelivery(order._id);
                if (autoAssignment) order.deliveryId = autoAssignment.delivery._id;
            } catch (assignmentError) {
                console.error("Automatic delivery assignment failed:", assignmentError.message);
            }
        }

        void notifyCustomer(order._id, status);
        return res.status(200).json({
            message: status === "Out for Delivery"
                ? (autoAssignment
                    ? `Order marked Out for Delivery and assigned to ${autoAssignment.delivery.deliveryName}.`
                    : "Order marked Out for Delivery. No delivery partner is currently available, so it is waiting for a partner to accept it.")
                : "Order status updated successfully",
            status: 1,
            data: order
        });

    } catch (error) {
        console.error("Admin order status update error:", error);

        return res.status(500).json({
            message: "Failed to update order status",
            status: 0
        });
    }
};

export const adminDeleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        status: 0,
      });
    }

    if (
      order.status !== "Cancelled" &&
      order.status !== "Delivered"
    ) {
      return res.status(400).json({
        message: "Only cancelled or delivered orders can be deleted",
        status: 0,
      });
    }

    await orderModel.findByIdAndDelete(orderId);

    res.status(200).json({
      message: "Order deleted successfully",
      status: 1,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to delete order",
      status: 0,
    });
  }
};

export const getReturnRequests = async (req, res) => {
  try {
    const orders = await orderModel
      .find({
            returnStatus: {
                $in: ["Return Requested", "Approved"],
            },
        })
      .populate("customerId", "name email")
      .populate("restaurantId", "restaurantName")
      .populate("deliveryId")
      .sort({ returnRequestedAt: -1 });

    return res.status(200).json({
      message: "Return requests fetched successfully",
      status: 1,
      data: orders,
    });
  } catch (error) {
    console.error("Get return requests error:", error);

    return res.status(500).json({
      message: "Failed to fetch return requests",
      status: 0,
    });
  }
};

export const reviewOrderReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { decision, returnAdminNote = "" } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be Approved or Rejected",
        status: 0,
      });
    }

    if (
      typeof returnAdminNote !== "string" ||
      returnAdminNote.trim().length > 500
    ) {
      return res.status(400).json({
        message: "Admin note must be a string of up to 500 characters",
        status: 0,
      });
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      {
        _id: orderId,
        status: "Delivered",
        returnStatus: "Return Requested",
      },
      {
        $set: {
          returnStatus: decision,
          returnAdminNote: returnAdminNote.trim(),
          returnReviewedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Pending return request not found",
        status: 0,
      });
    }

    return res.status(200).json({
      message: `Return request ${decision.toLowerCase()} successfully`,
      status: 1,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Review return request error:", error);

    return res.status(500).json({
      message: "Failed to review return request",
      status: 0,
    });
  }
};


export const processOrderRefund = async (req, res) => {
    let order;

    try {
        const { orderId } = req.params;

        // Find the order first.
        order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                status: 0,
            });
        }

        if (order.returnStatus !== "Approved") {
            return res.status(400).json({
                message: "The return request must be approved first",
                status: 0,
            });
        }

        // Prevent duplicate processing.
        if (
            order.refundStatus === "Processed" ||
            order.refundStatus === "Processing" ||
            order.refundId
        ) {
            return res.status(400).json({
                message: "A refund has already been initiated or is being processed",
                status: 0,
            });
        }

        // COD orders require manual handling if payment was collected.
        if (order.paymentMethod === "COD") {
            order.refundStatus =
                order.paymentStatus === "Paid"
                    ? "Manual Required"
                    : "Not Initiated";

            await order.save();

            return res.status(200).json({
                message:
                    order.paymentStatus === "Paid"
                        ? "Manual refund required for this COD order"
                        : "No online refund is required because COD payment is not recorded as paid",
                status: 1,
                data: order,
            });
        }

        if (order.paymentMethod !== "Online") {
            return res.status(400).json({
                message: "Unsupported payment method",
                status: 0,
            });
        }

        if (order.paymentStatus !== "Paid") {
            return res.status(400).json({
                message: "Only paid online orders can be refunded",
                status: 0,
            });
        }

        if (!order.razorpayPaymentId) {
            return res.status(400).json({
                message: "Razorpay payment ID is missing",
                status: 0,
            });
        }

        if (!Number.isFinite(order.totalAmount) || order.totalAmount <= 0) {
            return res.status(400).json({
                message: "Invalid refund amount",
                status: 0,
            });
        }

        // COD returns can be marked for manual handling without Razorpay.
        // Only require Razorpay configuration before claiming an online refund.
        if (!isRazorpayConfigured()) {
            return res.status(503).json({
                message: "Razorpay is not configured. No online refund request was submitted.",
                status: 0,
            });
        }

        /*
         * Atomically claim the refund.
         * Only one request can change an eligible order to Processing.
         */
        const claimedOrder = await orderModel.findOneAndUpdate(
            {
                _id: orderId,
                returnStatus: "Approved",
                paymentMethod: "Online",
                paymentStatus: "Paid",
                refundStatus: {
                    $nin: ["Processing", "Processed", "Manual Required"],
                },
                $or: [
                    { refundId: null },
                    { refundId: { $exists: false } },
                ],
            },
            {
                $set: {
                    refundStatus: "Processing",
                    refundAmount: order.totalAmount,
                    refundFailureReason: "",
                },
            },
            { new: true }
        );

        if (!claimedOrder) {
            return res.status(409).json({
                message:
                    "This refund is already being processed or the order is no longer eligible",
                status: 0,
            });
        }

        /*
         * Call Razorpay only after successfully claiming the order.
         */
        let refund;

        try {
            refund = await razorpay.payments.refund(
                claimedOrder.razorpayPaymentId,
                {
                    amount: Math.round(claimedOrder.totalAmount * 100),
                    notes: {
                        orderId: claimedOrder._id.toString(),
                        reason: "Approved WebBites order return",
                    },
                }
            );
        } catch (refundError) {
            console.error("Razorpay refund error:", refundError);

            /*
             * The request may have reached Razorpay even if our application
             * did not receive a response. Keep it Processing so that another
             * click cannot blindly submit a second refund.
             *
             * Reconcile the refund with Razorpay before deciding whether
             * this order can safely be retried.
             */
            await orderModel.updateOne(
                {
                    _id: claimedOrder._id,
                    refundStatus: "Processing",
                    refundId: null,
                },
                {
                    $set: {
                        refundFailureReason:
                            "Refund result is uncertain. Verify the refund in Razorpay before retrying.",
                    },
                }
            );

            return res.status(502).json({
                message:
                    "Razorpay did not confirm the refund result. Verify it in the Razorpay Dashboard before retrying.",
                status: 0,
            });
        }

        // Save the refund details returned by Razorpay.
        claimedOrder.refundId = refund.id;
        claimedOrder.refundAmount = refund.amount / 100;
        claimedOrder.refundStatus =
            refund.status === "processed" ? "Processed" : "Processing";

        if (refund.status === "processed") {
            claimedOrder.paymentStatus = "Refunded";
            claimedOrder.refundProcessedAt = new Date();
        }

        claimedOrder.refundFailureReason = "";
        await claimedOrder.save();

        return res.status(200).json({
            message:
                refund.status === "processed"
                    ? "Refund processed successfully"
                    : "Refund request accepted; final status is pending",
            status: 1,
            data: claimedOrder,
        });
    } catch (error) {
        console.error("Process refund error:", error);

        return res.status(500).json({
            message: "Failed to process refund",
            status: 0,
        });
    }
};

