import bcrypt from "bcrypt";
import restaurantModel from "../models/RestaurantModel.js";
import generateToken from "../utils/jwtutils.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";
import sendEmail from "../utils/emailUtils.js";

export const addRestaurant = async (req, res) => {
    try {
        const {
            restaurantName,
            ownerName,
            email,
            phone,
            address,
            password,
        } = req.body;

        // Check required fields
        if (
            !restaurantName?.trim() ||
            !ownerName?.trim() ||
            !email?.trim() ||
            !phone?.trim() ||
            !address?.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "All fields are required",
                status: 0,
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address",
                status: 0,
            });
        }

        // Validate phone number
        if (!/^\d{10}$/.test(phone.trim())) {
            return res.status(400).json({
                message: "Phone number must contain exactly 10 digits",
                status: 0,
            });
        }

        // Validate password
        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long",
                status: 0,
            });
        }

        // Check for duplicate email
        const existingRestaurant = await restaurantModel.findOne({
            email: normalizedEmail,
        });

        if (existingRestaurant) {
            return res.status(409).json({
                message: "Restaurant email already registered",
                status: 0,
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create restaurant
        const saveRestaurant = await restaurantModel.create({
            restaurantName: restaurantName.trim(),
            ownerName: ownerName.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            address: address.trim(),
            password: hashedPassword,
            isApproved: false,
            isOpen: false,
        });

        await sendEmail({
            to: normalizedEmail,
            name: ownerName.trim(),
            subject: "WebBites restaurant registration received",
            message: `We have received the registration for ${restaurantName.trim()}. Your account is pending admin review. You will receive another email when a decision is made.`,
            details: [
                { label: "Restaurant", value: restaurantName.trim() },
                { label: "Status", value: "Pending admin approval" },
            ],
        });

        // Return safe restaurant details
        return res.status(201).json({
            message: "Restaurant registered successfully!",
            status: 1,
            data: {
                id: saveRestaurant._id,
                restaurantName: saveRestaurant.restaurantName,
                ownerName: saveRestaurant.ownerName,
                email: saveRestaurant.email,
                phone: saveRestaurant.phone,
                address: saveRestaurant.address,
                isApproved: saveRestaurant.isApproved,
            },
        });

    } catch (error) {
        // Handle duplicate-key errors if two registrations
        // attempt to use the same email simultaneously.
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Restaurant email already registered",
                status: 0,
            });
        }

        console.error("Restaurant registration error:", error);

        return res.status(500).json({
            message: "Failed to register restaurant",
            status: 0,
        });
    }
};


export const restaurantLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
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

        // Find restaurant
        const restaurant = await restaurantModel.findOne({
            email: normalizedEmail,
        });

        if (!restaurant) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: 0,
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            restaurant.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: 0,
            });
        }

        if (!restaurant.isApproved) {
            return res.status(403).json({
                message: "Your restaurant registration is awaiting admin approval. We will email you when your account is approved.",
                status: 0,
                approvalPending: true,
            });
        }

        // Generate JWT
        const token = generateToken(restaurant, "restaurant");

        // Return safe restaurant details
        return res.status(200).json({
            message: "Restaurant login successful",
            status: 1,
            data: {
                id: restaurant._id,
                restaurantName: restaurant.restaurantName,
                ownerName: restaurant.ownerName,
                email: restaurant.email,
                phone: restaurant.phone,
                address: restaurant.address,
            },
            token,
        });

    } catch (error) {
        console.error("Restaurant login error:", error);

        return res.status(500).json({
            message: "Restaurant login failed",
            status: 0,
        });
    }
};


export const getRestaurants = async (req, res) => {
    try {
        const restaurants = await restaurantModel
            .find({ isApproved: { $ne: false } })
            .select("-password");

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

export const getRestaurantProfile = async (req, res) => {
    try {
        const restaurant = await restaurantModel
            .findById(req.user.id)
            .select("-password");

        if (!restaurant) {
            return res.status(404).json({
                message: "Restaurant not found",
                status: 0,
            });
        }

        res.status(200).json({
            message: "Restaurant profile fetched successfully",
            status: 1,
            data: restaurant,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: 0,
        });
    }
};


export const updateRestaurantProfile = async (req, res) => {
    try {
        const {
            restaurantName,
            ownerName,
            phone,
            address,
        } = req.body;

        // Validate required fields
        if (
            typeof restaurantName !== "string" ||
            !restaurantName.trim() ||
            typeof ownerName !== "string" ||
            !ownerName.trim() ||
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

        // Validate phone number
        if (!/^\d{10}$/.test(phone.trim())) {
            return res.status(400).json({
                message: "Phone number must contain exactly 10 digits",
                status: 0,
            });
        }

        // Update only allowed fields
        const restaurant = await restaurantModel.findByIdAndUpdate(
            req.user.id,
            {
                restaurantName: restaurantName.trim(),
                ownerName: ownerName.trim(),
                phone: phone.trim(),
                address: address.trim(),
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!restaurant) {
            return res.status(404).json({
                message: "Restaurant not found",
                status: 0,
            });
        }

        return res.status(200).json({
            message: "Restaurant profile updated successfully",
            status: 1,
            data: restaurant,
        });

    } catch (error) {
        console.error("Restaurant profile update error:", error);

        return res.status(500).json({
            message: "Failed to update restaurant profile",
            status: 0,
        });
    }
};



export const getRestaurantEarnings = async (req, res) => {
  try {
    const orders = await orderModel.find({
      restaurantId: req.user.id,
      status: "Delivered",
    });

    const totalOrders = orders.length;

    const totalEarnings = orders.reduce(
      (total, order) => total + order.totalAmount,
      0
    );

    res.status(200).json({
      message: "Restaurant earnings fetched successfully",
      status: 1,
      data: {
        totalOrders,
        totalEarnings,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch restaurant earnings",
      status: 0,
    });
  }
};

export const toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await restaurantModel.findById(req.user.id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        status: 0,
      });
    }

    restaurant.isOpen = !restaurant.isOpen;

    await restaurant.save();

    res.status(200).json({
      message: restaurant.isOpen
        ? "Restaurant is now open"
        : "Restaurant is now closed",
      status: 1,
      data: {
        isOpen: restaurant.isOpen,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to update restaurant status",
      status: 0,
    });
  }
};

export const searchRestaurants = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || !search.trim()) {
      return res.status(200).json({
        message: "Search completed successfully",
        status: 1,
        data: [],
      });
    }

    const restaurants = await restaurantModel.find({
      isApproved: { $ne: false },
      $or: [
        {
          restaurantName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          address: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    }).select("-password");

    res.status(200).json({
      message: "Restaurants found successfully",
      status: 1,
      data: restaurants,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to search restaurants",
      status: 0,
    });
  }
};

export const searchRestaurantsAndProducts = async (req, res) => {
    try {
        const { search } = req.query;

        if (typeof search !== "string" || !search.trim()) {
            return res.status(200).json({
                message: "Search completed successfully",
                status: 1,
                data: {
                    restaurants: [],
                    products: [],
                },
            });
        }

        const searchText = search.trim().slice(0, 100);

        // Escape special regex characters
        const escapedSearch = searchText.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        // Search restaurants
        const restaurants = await restaurantModel
            .find({
                isApproved: { $ne: false },
                $or: [
                    {
                        restaurantName: {
                            $regex: escapedSearch,
                            $options: "i",
                        },
                    },
                    {
                        address: {
                            $regex: escapedSearch,
                            $options: "i",
                        },
                    },
                ],
            })
            .select("-password");

        // Search available products only from approved restaurants
        const approvedRestaurants = await restaurantModel.find({ isApproved: { $ne: false } }).select("_id");
        const approvedRestaurantIds = approvedRestaurants.map((restaurant) => restaurant._id);
        const products = await productModel
            .find({
                restaurantId: { $in: approvedRestaurantIds },
                productName: {
                    $regex: escapedSearch,
                    $options: "i",
                },
                available: true,
            })
            .populate("restaurantId", "restaurantName address isOpen");

        return res.status(200).json({
            message: "Search completed successfully",
            status: 1,
            data: {
                restaurants,
                products,
            },
        });

    } catch (error) {
        console.error("Search error:", error);

        return res.status(500).json({
            message: "Failed to search",
            status: 0,
        });
    }
};



export const getRestaurantInfo = async (req, res) => {
  try {
    const restaurantId = req.user.id;

    // Get restaurant information
    const restaurant = await restaurantModel
      .findById(restaurantId)
      .select("-password");

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        status: 0,
      });
    }

    // Get all orders of this restaurant
    const orders = await orderModel
      .find({ restaurantId })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });

    // Today's date
    const today = new Date();

    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    // Today's orders
    const todaysOrders = orders.filter(
      (order) =>
        order.createdAt >= startOfDay &&
        order.createdAt < endOfDay
    );

    // Pending orders
    const pendingOrders = orders.filter(
      (order) => order.status === "Pending"
    );

    // Completed / delivered orders
    const completedOrders = orders.filter(
      (order) => order.status === "Delivered"
    );

    // Total earnings
    const totalEarnings = completedOrders.reduce(
      (total, order) => total + order.totalAmount,
      0
    );

    // Recent orders
    const recentOrders = orders.slice(0, 5).map((order) => ({
      _id: order._id,
      customerName: order.customerId?.name || "Customer",
      itemsCount: order.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
    }));

    res.status(200).json({
      message: "Restaurant information fetched successfully",
      status: 1,
      data: {
        restaurant: {
          _id: restaurant._id,
          restaurantName: restaurant.restaurantName,
          ownerName: restaurant.ownerName,
          email: restaurant.email,
          phone: restaurant.phone,
          address: restaurant.address,
          isOpen: restaurant.isOpen,
          isApproved: restaurant.isApproved,
        },

        stats: {
          todaysOrders: todaysOrders.length,
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length,
          totalEarnings,
        },

        recentOrders,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch restaurant information",
      status: 0,
    });
  }
};

export const updateRestaurantProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please choose an image", status: 0 });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: "Profile picture storage is not configured", status: 0 });
    }
    const current = await restaurantModel.findById(req.user.id).select("profilePicturePublicId");
    if (!current) return res.status(404).json({ message: "Restaurant not found", status: 0 });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "webbites/profiles/restaurants", resource_type: "image", transformation: [{ width: 500, height: 500, crop: "limit" }] }, (error, uploaded) => error ? reject(error) : resolve(uploaded));
      stream.end(req.file.buffer);
    });
    const updated = await restaurantModel.findByIdAndUpdate(req.user.id, { $set: { profilePicture: result.secure_url, profilePicturePublicId: result.public_id } }, { new: true }).select("-password");
    if (current.profilePicturePublicId) cloudinary.uploader.destroy(current.profilePicturePublicId).catch((error) => console.error("Old restaurant picture cleanup failed:", error.message));
    return res.status(200).json({ message: "Profile picture updated successfully", status: 1, data: updated });
  } catch (error) {
    console.error("Restaurant profile picture upload error:", error.message);
    return res.status(500).json({ message: "Failed to upload profile picture", status: 0 });
  }
};


export const updateRestaurantCoverImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please choose an image", status: 0 });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: "Image storage is not configured", status: 0 });
    }
    const current = await restaurantModel.findById(req.user.id).select("coverImagePublicId");
    if (!current) return res.status(404).json({ message: "Restaurant not found", status: 0 });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "webbites/restaurants/covers", resource_type: "image", transformation: [{ width: 1200, height: 700, crop: "limit" }] }, (error, uploaded) => error ? reject(error) : resolve(uploaded));
      stream.end(req.file.buffer);
    });
    const updated = await restaurantModel.findByIdAndUpdate(req.user.id, { $set: { coverImage: result.secure_url, coverImagePublicId: result.public_id } }, { new: true }).select("-password");
    if (current.coverImagePublicId) cloudinary.uploader.destroy(current.coverImagePublicId).catch((error) => console.error("Old restaurant cover cleanup failed:", error.message));
    return res.status(200).json({ message: "Restaurant cover image updated successfully", status: 1, data: updated });
  } catch (error) {
    console.error("Restaurant cover image upload error:", error.message);
    return res.status(500).json({ message: "Failed to upload restaurant cover image", status: 0 });
  }
};
