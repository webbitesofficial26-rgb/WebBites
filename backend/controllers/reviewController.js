import mongoose from "mongoose";
import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";

export const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body || {};

    if (
      typeof orderId !== "string" ||
      !mongoose.isValidObjectId(orderId) ||
      !(typeof rating === "number" || (typeof rating === "string" && rating.trim() !== "")) ||
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5 ||
      typeof comment !== "string" ||
      !comment.trim() ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "Provide a valid order, a rating from 1 to 5, and a comment of at most 1000 characters",
        status: 0,
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      customerId: req.user.id,
      status: "Delivered",
    });

    if (!order) {
      return res.status(400).json({
        message: "You can review only delivered orders",
        status: 0,
      });
    }

    const existingReview = await reviewModel.findOne({
      orderId,
      customerId: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this order",
        status: 0,
      });
    }

    const review = await reviewModel.create({
      customerId: req.user.id,
      restaurantId: order.restaurantId,
      orderId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    res.status(201).json({
      message: "Review submitted successfully",
      status: 1,
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You have already reviewed this order", status: 0 });
    }
    console.error("Create review error:", error.message);
    return res.status(500).json({ message: "Failed to submit review", status: 0 });
  }
};


export const getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.isValidObjectId(restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurant ID", status: 0 });
    }

    const reviews = await reviewModel
      .find({ restaurantId })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : reviews.reduce((total, review) => total + review.rating, 0) /
          totalReviews;

    res.status(200).json({
      message: "Restaurant reviews fetched successfully",
      status: 1,
      data: {
        reviews,
        totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch reviews",
      status: 0,
    });
  }
};