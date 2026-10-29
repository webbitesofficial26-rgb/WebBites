import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import offerTemplateRoutes from "./routes/offerTemplateRoutes.js";
import restaurantOfferRoutes from "./routes/restaurantOfferRoutes.js";
import accountPasswordRoutes from "./routes/accountPasswordRoutes.js";
import adminChatRoutes from "./routes/adminChatRoutes.js";
import restaurantChatRoutes from "./routes/restaurantChatRoutes.js";
import deliveryChatRoutes from "./routes/deliveryChatRoutes.js";
import customerChatRoutes from "./routes/customerChatRoutes.js";
import { startPendingOrderExpiryJob } from "./utils/expirePendingOrders.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).send("WebBites API is running");
});

app.use(userRoutes);
app.use(restaurantRoutes);
app.use(deliveryRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.use(adminRoutes);
app.use(adminAuthRoutes);
app.use(reviewRoutes);
app.use(couponRoutes);
app.use(offerTemplateRoutes);
app.use(restaurantOfferRoutes);
app.use(accountPasswordRoutes);
app.use(adminChatRoutes);
app.use(restaurantChatRoutes);
app.use(deliveryChatRoutes);
app.use(customerChatRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: "API endpoint not found", status: 0 });
});

// Keep malformed JSON and upload errors in the API's JSON response format.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  const statusCode = error?.code === "LIMIT_FILE_SIZE"
    ? 413
    : Number.isInteger(error?.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;

  if (statusCode >= 500) console.error("Unhandled API error:", error.message);

  return res.status(statusCode).json({
    message: statusCode >= 500 ? "Internal server error" : error.message || "Invalid request",
    status: 0,
  });
});

const startServer = async () => {
  try {
    // Do not accept API traffic until MongoDB is connected.
    await connectDB();
    startPendingOrderExpiryJob();

    const server = app.listen(PORT, () => {
      console.log(`WebBites API is running on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down WebBites API...`);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Unable to start WebBites API:", error.message);
    process.exit(1);
  }
};

startServer();
