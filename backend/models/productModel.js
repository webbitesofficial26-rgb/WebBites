import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        productName: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
        },

        dietaryType: {
            type: String,
            enum: ["veg", "nonveg"],
            required: true,
        },

        image: {
            type: String,
            default: "",
        },
        imagePublicId: 
        { 
            type: String,
            default: "",
        },
        available: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const productModel = mongoose.model(
    "Product",
    productSchema
);

export default productModel;