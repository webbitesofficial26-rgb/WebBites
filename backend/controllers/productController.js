import productModel from "../models/productModel.js";
import restaurantModel from "../models/RestaurantModel.js";
import cloudinary from "../config/cloudinary.js";

export const addProduct = async (req, res) => {
    try {
        const {
            productName,
            description,
            price,
            category,
            dietaryType,
        } = req.body;

        // Validate required fields
        if (
            typeof productName !== "string" ||
            !productName.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            price === undefined ||
            price === null ||
            price === "" ||
            typeof category !== "string" ||
            !category.trim() ||
            !["veg", "nonveg"].includes(dietaryType)
        ) {
            return res.status(400).json({
                message: "All product fields are required",
                status: 0,
            });
        }

        // Validate price
        const productPrice = Number(price);

        if (!Number.isFinite(productPrice) || productPrice <= 0) {
            return res.status(400).json({
                message: "Price must be a valid number greater than zero",
                status: 0,
            });
        }

        // Validate image
        if (!req.file) {
            return res.status(400).json({
                message: "Product image is required",
                status: 0,
            });
        }

        // Upload image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "webbites/products",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            stream.end(req.file.buffer);
        });

        // Save product with Cloudinary URL and public ID
        const product = await productModel.create({
            restaurantId: req.user.id,
            productName: productName.trim(),
            description: description.trim(),
            price: productPrice,
            category: category.trim(),
            dietaryType,
            image: uploadResult.secure_url,
            imagePublicId: uploadResult.public_id,
        });

        return res.status(201).json({
            message: "Product added successfully",
            status: 1,
            data: product,
        });

    } catch (error) {
        console.error("Add product error:", error);

        return res.status(500).json({
            message: "Failed to add product",
            status: 0,
        });
    }
};



export const getMyProducts = async (req, res) => {
    try {
        const products = await productModel.find({
            restaurantId: req.user.id,
        });

        res.status(200).json({
            message: "Products fetched successfully",
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



export const updateProduct = async (req, res) => {
    let newImagePublicId = null;

    try {
        const { id } = req.params;

        const {
            productName,
            description,
            price,
            category,
            dietaryType,
            available,
        } = req.body;

        // Validate required fields
        if (
            typeof productName !== "string" ||
            !productName.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            price === undefined ||
            price === null ||
            price === "" ||
            typeof category !== "string" ||
            !category.trim() ||
            !["veg", "nonveg"].includes(dietaryType)
        ) {
            return res.status(400).json({
                message: "All product fields are required",
                status: 0,
            });
        }

        // Validate price
        const productPrice = Number(price);

        if (!Number.isFinite(productPrice) || productPrice <= 0) {
            return res.status(400).json({
                message: "Price must be a valid number greater than zero",
                status: 0,
            });
        }

        // Validate availability
        if (
            available !== undefined &&
            available !== true &&
            available !== false &&
            available !== "true" &&
            available !== "false"
        ) {
            return res.status(400).json({
                message: "Availability must be true or false",
                status: 0,
            });
        }

        // Find product belonging to the logged-in restaurant
        const product = await productModel.findOne({
            _id: id,
            restaurantId: req.user.id,
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                status: 0,
            });
        }

        // Remember the old image details
        const oldImagePublicId = product.imagePublicId;

        // Upload replacement image if provided
        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "webbites/products",
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                stream.end(req.file.buffer);
            });

            newImagePublicId = uploadResult.public_id;

            product.image = uploadResult.secure_url;
            product.imagePublicId = uploadResult.public_id;
        }

        // Update other product details
        product.productName = productName.trim();
        product.description = description.trim();
        product.price = productPrice;
        product.category = category.trim();
        product.dietaryType = dietaryType;

        if (available !== undefined) {
            product.available =
                available === true || available === "true";
        }

        // Save changes to MongoDB first
        await product.save();

        // Delete old image only after the database save succeeds
        if (
            req.file &&
            oldImagePublicId &&
            oldImagePublicId !== newImagePublicId
        ) {
            try {
                const deleteResult = await cloudinary.uploader.destroy(
                    oldImagePublicId,
                    { resource_type: "image" }
                );

                if (deleteResult.result !== "ok" &&
                    deleteResult.result !== "not found") {
                    console.error(
                        "Old Cloudinary image was not deleted:",
                        deleteResult
                    );
                }
            } catch (deleteError) {
                // The product update succeeded; report cleanup failure in logs.
                console.error(
                    "Failed to delete old Cloudinary image:",
                    deleteError
                );
            }
        }

        return res.status(200).json({
            message: "Product updated successfully",
            status: 1,
            data: product,
        });

    } catch (error) {
        // If upload succeeded but saving failed, clean up the new upload.
        if (newImagePublicId) {
            try {
                await cloudinary.uploader.destroy(
                    newImagePublicId,
                    { resource_type: "image" }
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up new Cloudinary image:",
                    cleanupError
                );
            }
        }

        console.error("Update product error:", error);

        return res.status(500).json({
            message: "Failed to update product",
            status: 0,
        });
    }
};



export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the product belonging to the logged-in restaurant
        const product = await productModel.findOne({
            _id: id,
            restaurantId: req.user.id,
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                status: 0,
            });
        }

        // Save the Cloudinary ID before deleting the database record
        const imagePublicId = product.imagePublicId;

        // Delete product from MongoDB
        await productModel.deleteOne({
            _id: product._id,
            restaurantId: req.user.id,
        });

        // Delete its image from Cloudinary, if an ID exists
        if (imagePublicId) {
            try {
                const result = await cloudinary.uploader.destroy(
                    imagePublicId,
                    { resource_type: "image" }
                );

                if (
                    result.result !== "ok" &&
                    result.result !== "not found"
                ) {
                    console.error(
                        "Cloudinary image deletion was unsuccessful:",
                        result
                    );
                }
            } catch (cloudinaryError) {
                console.error(
                    "Failed to delete product image from Cloudinary:",
                    cloudinaryError
                );
            }
        }

        return res.status(200).json({
            message: "Product deleted successfully",
            status: 1,
        });

    } catch (error) {
        // Invalid MongoDB ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid product ID",
                status: 0,
            });
        }

        console.error("Delete product error:", error);

        return res.status(500).json({
            message: "Failed to delete product",
            status: 0,
        });
    }
};



export const getRestaurantProducts = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const restaurant = await restaurantModel.findOne({
            _id: restaurantId,
            isApproved: { $ne: false },
        }).select("_id");

        if (!restaurant) {
            return res.status(404).json({
                message: "Restaurant is not available",
                status: 0,
            });
        }

        const products = await productModel.find({
            restaurantId: restaurantId,
            available: true,
        });

        res.status(200).json({
            message: "Restaurant products fetched successfully",
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


export const toggleProductAvailability = async (req, res) => {
    try {
        const product = await productModel.findOne({
            _id: req.params.id,
            restaurantId: req.user.id,
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                status: 0,
            });
        }

        product.available = !product.available;

        await product.save();

        res.status(200).json({
            message: "Product availability updated successfully",
            status: 1,
            data: {
                available: product.available,
            },
        });
    } catch (error) {
        console.error("Toggle product availability error:", error);

        res.status(500).json({
            message: "Failed to update product availability",
            status: 0,
        });
    }
};

