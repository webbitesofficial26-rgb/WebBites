import userData from "../models/User.js";
import restaurantModel from "../models/RestaurantModel.js";
import deliveryModel from "../models/deliveryModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";
import sendEmail from "../utils/emailUtils.js";


export const getAdminDashboard = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

        const [
            totalCustomers,
            totalRestaurants,
            totalDeliveryPartners,
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            todayOrders,
            revenueResult,
            todayRevenueResult,
            codOrders,
            onlineOrders,
        ] = await Promise.all([
            userData.countDocuments(),
            restaurantModel.countDocuments(),
            deliveryModel.countDocuments(),
            orderModel.countDocuments(),
            orderModel.countDocuments({ status: "Pending" }),
            orderModel.countDocuments({ status: "Delivered" }),
            orderModel.countDocuments({ status: "Cancelled" }),

            orderModel.countDocuments({
                createdAt: {
                    $gte: startOfToday,
                    $lt: startOfTomorrow,
                },
            }),

            orderModel.aggregate([
                {
                    $match: {
                        status: "Delivered",
                        paymentStatus: { $ne: "Refunded" },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalAmount" },
                    },
                },
            ]),

            orderModel.aggregate([
                {
                    $match: {
                        status: "Delivered",
                        paymentStatus: { $ne: "Refunded" },
                        createdAt: {
                            $gte: startOfToday,
                            $lt: startOfTomorrow,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalAmount" },
                    },
                },
            ]),

            orderModel.countDocuments({
                paymentMethod: "COD",
            }),

            orderModel.countDocuments({
                paymentMethod: "Online",
            }),
        ]);

        res.status(200).json({
            message: "Admin dashboard data fetched successfully",
            status: 1,
            data: {
                totalCustomers,
                totalRestaurants,
                totalDeliveryPartners,
                totalOrders,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                todayOrders,
                totalRevenue: revenueResult[0]?.total || 0,
                todayRevenue: todayRevenueResult[0]?.total || 0,
                codOrders,
                onlineOrders,
            },
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);

        res.status(500).json({
            message: "Failed to fetch admin dashboard data",
            status: 0,
        });
    }
};



export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await restaurantModel
            .find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Restaurants fetched successfully",
            status: 1,
            data: restaurants,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: 0,
        });
    }
};




export const deleteRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // Validate MongoDB ObjectId
        if (!/^[a-fA-F0-9]{24}$/.test(restaurantId)) {
            return res.status(400).json({
                message: "Invalid restaurant ID",
                status: 0,
            });
        }

        // Find restaurant
        const restaurant = await restaurantModel.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                message: "Restaurant not found",
                status: 0,
            });
        }

        // Find all orders belonging to this restaurant
        const orders = await orderModel.find({
            restaurantId: restaurantId,
        });

        // Cancel active orders and notify customers
        const activeStatuses = [
            "Pending",
            "Accepted",
            "Preparing",
            "Out for Delivery",
        ];

        const activeOrders = orders.filter((order) =>
            activeStatuses.includes(order.status)
        );

        for (const order of activeOrders) {
            order.status = "Cancelled";
            await order.save();

            try {
                const customer = await userData.findById(
                    order.customerId
                );

                if (customer?.email) {
                    await sendEmail({
                        to: customer.email,
                        name: customer.name || "Customer",
                        subject: "Order Cancelled - WebBites",
                        message:
                            `Your order from ${restaurant.restaurantName} ` +
                            "has been cancelled because the restaurant is no longer available.",
                        details: [
                            {
                                label: "Order ID",
                                value: order._id.toString(),
                            },
                            {
                                label: "Restaurant",
                                value: restaurant.restaurantName,
                            },
                            {
                                label: "Order Status",
                                value: "Cancelled",
                            },
                        ],
                    });
                }
            } catch (emailError) {
                // Email failure must not stop restaurant deletion
                console.error(
                    `Failed to notify customer for order ${order._id}:`,
                    emailError
                );
            }
        }

        // Find products belonging to this restaurant
        const products = await productModel.find({
            restaurantId: restaurantId,
        });

        // Delete products from MongoDB
        await productModel.deleteMany({
            restaurantId: restaurantId,
        });

        // Delete associated Cloudinary images
        for (const product of products) {
            if (product.imagePublicId) {
                try {
                    const result = await cloudinary.uploader.destroy(
                        product.imagePublicId,
                        { resource_type: "image" }
                    );

                    if (
                        result.result !== "ok" &&
                        result.result !== "not found"
                    ) {
                        console.error(
                            "Cloudinary image deletion unsuccessful:",
                            product.imagePublicId,
                            result
                        );
                    }
                } catch (cloudinaryError) {
                    console.error(
                        "Failed to delete product image:",
                        product.imagePublicId,
                        cloudinaryError
                    );
                }
            }
        }

        // Delete restaurant after processing orders and products
        await restaurantModel.findByIdAndDelete(restaurantId);

        return res.status(200).json({
            message:
                "Restaurant deleted successfully. Active orders were cancelled and customers were notified.",
            status: 1,
        });

    } catch (error) {
        console.error("Delete restaurant error:", error);

        return res.status(500).json({
            message: "Failed to delete restaurant",
            status: 0,
        });
    }
};



export const getAllCustomers = async (req, res) => {
  try {
    const customers = await userData
      .find()
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Customers fetched successfully",
      status: 1,
      data: customers,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch customers",
      status: 0,
    });
  }

};

export const getAllDeliveryPartners = async (req, res) => {
  try {
    const deliveryPartners = await deliveryModel
      .find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Delivery partners fetched successfully",
      status: 1,
      data: deliveryPartners,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch delivery partners",
      status: 0,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("customerId", "name email phone")
      .populate("restaurantId", "restaurantName address")
      .populate("deliveryId", "deliveryName email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Orders fetched successfully",
      status: 1,
      data: orders,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch orders",
      status: 0,
    });
  }
};

// Update restaurant by Admin


export const adminUpdateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            restaurantName,
            ownerName,
            email,
            phone,
            address
        } = req.body;

        const restaurant = await restaurantModel.findById(id);

        if (!restaurant) {
            return res.status(404).json({
                message: "Restaurant not found",
                status: 0
            });
        }

        restaurant.restaurantName = restaurantName;
        restaurant.ownerName = ownerName;
        restaurant.email = email;
        restaurant.phone = phone;
        restaurant.address = address;

        await restaurant.save();

        // Remove the password before sending the response
        const safeRestaurant = restaurant.toObject();
        delete safeRestaurant.password;

        return res.status(200).json({
            message: "Restaurant updated successfully",
            status: 1,
            data: safeRestaurant
        });

    } catch (error) {
        console.error("Admin update restaurant error:", error);

        return res.status(500).json({
            message: "Failed to update restaurant",
            status: 0
        });
    }
};



export const adminSetRestaurantApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    if (typeof isApproved !== "boolean") {
      return res.status(400).json({ message: "Please provide isApproved as true or false", status: 0 });
    }
    const restaurant = await restaurantModel.findById(id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found", status: 0 });

    restaurant.isApproved = isApproved;
    if (!isApproved) restaurant.isOpen = false;
    await restaurant.save();

    await sendEmail({
      to: restaurant.email,
      name: restaurant.ownerName,
      subject: isApproved ? "WebBites restaurant account approved" : "WebBites restaurant account status updated",
      message: isApproved
        ? `Good news! The registration for ${restaurant.restaurantName} has been approved. You can now log in to your restaurant account.`
        : `The registration approval for ${restaurant.restaurantName} is currently inactive. Please contact WebBites support if you believe this is a mistake.`,
      details: [
        { label: "Restaurant", value: restaurant.restaurantName },
        { label: "Account status", value: isApproved ? "Approved" : "Not approved" },
      ],
    });

    return res.status(200).json({
      message: isApproved ? "Restaurant approved successfully" : "Restaurant approval revoked successfully",
      status: 1,
      data: { id: restaurant._id, isApproved: restaurant.isApproved, isOpen: restaurant.isOpen },
    });
  } catch (error) {
    console.error("Restaurant approval update error:", error);
    return res.status(500).json({ message: "Failed to update restaurant approval", status: 0 });
  }
};

export const adminToggleRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await restaurantModel.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        status: 0
      });
    }

    restaurant.isOpen = !restaurant.isOpen;

    await restaurant.save();

    res.status(200).json({
      message: "Restaurant status updated successfully",
      status: 1,
      data: {
        isOpen: restaurant.isOpen
      }
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Failed to update restaurant status",
      status: 0
    });
  }
};


export const adminUpdateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        // Validate customer ID
        if (!/^[a-fA-F0-9]{24}$/.test(id)) {
            return res.status(400).json({
                message: "Invalid customer ID",
                status: 0,
            });
        }

        // Validate required fields
        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
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

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.trim();
        const cleanAddress = address.trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address",
                status: 0,
            });
        }

        // Validate phone number
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                message: "Phone number must contain exactly 10 digits",
                status: 0,
            });
        }

        // Find customer
        const customer = await userData.findById(id);

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found",
                status: 0,
            });
        }

        // Prevent duplicate email addresses
        const existingCustomer = await userData.findOne({
            email: cleanEmail,
            _id: { $ne: id },
        });

        if (existingCustomer) {
            return res.status(409).json({
                message: "Email address is already in use",
                status: 0,
            });
        }

        // Update only permitted fields
        customer.name = cleanName;
        customer.email = cleanEmail;
        customer.phone = cleanPhone;
        customer.address = cleanAddress;

        await customer.save();

        // Never return the password
        const safeCustomer = customer.toObject();
        delete safeCustomer.password;
        delete safeCustomer.resetPasswordToken;
        delete safeCustomer.resetPasswordExpires;

        return res.status(200).json({
            message: "Customer updated successfully",
            status: 1,
            data: safeCustomer,
        });
    } catch (error) {
        console.error("Admin update customer error:", error);

        // Handle duplicate email index errors
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email address is already in use",
                status: 0,
            });
        }

        return res.status(500).json({
            message: "Failed to update customer",
            status: 0,
        });
    }
};





// Delete customer by Admin
export const adminDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await userData.findById(id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
        status: 0
      });
    }

    await userData.findByIdAndDelete(id);

    res.status(200).json({
      message: "Customer deleted successfully",
      status: 1
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to delete customer",
      status: 0
    });
  }
};



export const adminUpdateDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryName, email, phone, address } = req.body;

        // Validate delivery partner ID
        if (!/^[a-fA-F0-9]{24}$/.test(id)) {
            return res.status(400).json({
                message: "Invalid delivery partner ID",
                status: 0,
            });
        }

        // Validate required fields
        if (
            typeof deliveryName !== "string" ||
            !deliveryName.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
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
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.trim();
        const cleanAddress = address.trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address",
                status: 0,
            });
        }

        // Validate phone number
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                message: "Phone number must contain exactly 10 digits",
                status: 0,
            });
        }

        const delivery = await deliveryModel.findById(id);

        if (!delivery) {
            return res.status(404).json({
                message: "Delivery partner not found",
                status: 0,
            });
        }

        // Prevent duplicate email addresses
        const existingDelivery = await deliveryModel.findOne({
            email: cleanEmail,
            _id: { $ne: id },
        });

        if (existingDelivery) {
            return res.status(409).json({
                message: "Email address is already in use",
                status: 0,
            });
        }

        // Update only permitted fields
        delivery.deliveryName = cleanName;
        delivery.email = cleanEmail;
        delivery.phone = cleanPhone;
        delivery.address = cleanAddress;

        await delivery.save();

        // Never return the password
        const safeDelivery = delivery.toObject();
        delete safeDelivery.password;

        return res.status(200).json({
            message: "Delivery partner updated successfully",
            status: 1,
            data: safeDelivery,
        });
    } catch (error) {
        console.error("Admin update delivery error:", error);

        // Handle duplicate email index errors
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email address is already in use",
                status: 0,
            });
        }

        return res.status(500).json({
            message: "Failed to update delivery partner",
            status: 0,
        });
    }
};




// Delete delivery partner by Admin
export const adminDeleteDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await deliveryModel.findById(id);

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery partner not found",
        status: 0
      });
    }

    await deliveryModel.findByIdAndDelete(id);

    res.status(200).json({
      message: "Delivery partner deleted successfully",
      status: 1
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to delete delivery partner",
      status: 0
    });
  }
};



export const adminToggleDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const delivery = await deliveryModel.findById(id);

        if (!delivery) {
            return res.status(404).json({
                message: "Delivery partner not found",
                status: 0
            });
        }

        // Read the requested status from the request body
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                message: "Please provide isActive as true or false",
                status: 0
            });
        }

        // Set the requested status explicitly
        delivery.isActive = isActive;
        if (isActive) delivery.isApproved = true;

        await delivery.save();

        await sendEmail({
            to: delivery.email,
            name: delivery.deliveryName,
            subject: isActive ? "WebBites delivery account approved" : "WebBites delivery account status updated",
            message: isActive
                ? "Your WebBites delivery partner account has been approved. You can now log in and start accepting deliveries."
                : "Your WebBites delivery partner account has been deactivated. Please contact WebBites support if you believe this is a mistake.",
            details: [{ label: "Account status", value: isActive ? "Approved and active" : "Deactivated" }],
        });

        return res.status(200).json({
            message: isActive
                ? "Delivery partner approved successfully"
                : "Delivery partner deactivated successfully",
            status: 1,
            data: {
                id: delivery._id,
                deliveryName: delivery.deliveryName,
                isActive: delivery.isActive,
                isApproved: delivery.isApproved
            }
        });

    } catch (error) {
        console.error("Delivery status update error:", error);

        return res.status(500).json({
            message: "Failed to update delivery status",
            status: 0
        });
    }
};



// Get all products for Admin
export const getAllProducts = async (req, res) => {
    try {
        const products = await productModel
            .find()
            .populate("restaurantId", "restaurantName address")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "All products fetched successfully",
            status: 1,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: 0,
        });
    }
};


export const adminUpdateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            productName,
            description,
            price,
            category,
            image,
            available,
        } = req.body;

        // Validate product ID
        if (!/^[a-fA-F0-9]{24}$/.test(id)) {
            return res.status(400).json({
                message: "Invalid product ID",
                status: 0,
            });
        }

        // Validate required text fields
        if (
            typeof productName !== "string" ||
            !productName.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            typeof category !== "string" ||
            !category.trim() ||
            typeof image !== "string" ||
            !image.trim()
        ) {
            return res.status(400).json({
                message: "All product fields are required",
                status: 0,
            });
        }

        // Validate price
        if (
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0
        ) {
            return res.status(400).json({
                message: "Price must be a valid number greater than zero",
                status: 0,
            });
        }

        // Validate availability
        if (typeof available !== "boolean") {
            return res.status(400).json({
                message: "Availability must be true or false",
                status: 400,
            });
        }

        // Update only permitted fields
        const product = await productModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    productName: productName.trim(),
                    description: description.trim(),
                    price: Number(price),
                    category: category.trim(),
                    image: image.trim(),
                    available,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                status: 0,
            });
        }

        return res.status(200).json({
            message: "Product updated successfully",
            status: 1,
            data: product,
        });
    } catch (error) {
        console.error("Admin update product error:", error);

        return res.status(500).json({
            message: "Failed to update product",
            status: 0,
        });
    }
};


// Delete Product by Admin
export const adminDeleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await productModel.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                status: 0,
            });
        }

        res.status(200).json({
            message: "Product deleted successfully",
            status: 1,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: 0,
        });
    }
};

// Admin Dashboard Analytics
export const getAdminAnalytics = async (req, res) => {
    try {
        const now = new Date();

        // Start of the current month
        const currentMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        // Start of the month six months ago
        const sixMonthsAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 5,
            1
        );

        // Fetch monthly revenue for the last 6 months
        const monthlyRevenue = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered",
                    paymentStatus: { $ne: "Refunded" },
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);

        // Fetch order counts grouped by status
        const orderStatus = await orderModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Include months with zero revenue
        const revenueChart = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const existingMonth = monthlyRevenue.find(
                (item) =>
                    item._id.year === year &&
                    item._id.month === month
            );

            revenueChart.push({
                month: date.toLocaleString("en-US", {
                    month: "short",
                    year: "numeric"
                }),
                revenue: existingMonth
                    ? existingMonth.revenue
                    : 0
            });
        }

        const orderStatusChart = orderStatus.map((item) => ({
            status: item._id,
            count: item.count
        }));

        res.status(200).json({
            message: "Admin analytics fetched successfully",
            status: 1,
            data: {
                revenueChart,
                orderStatusChart
            }
        });
    } catch (error) {
        console.error("Admin analytics error:", error);

        res.status(500).json({
            message: "Failed to fetch admin analytics",
            status: 0
        });
    }
};

