import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import adminModel from "./models/adminModel.js";

const createAdmin = async () => {
    const name = process.env.ADMIN_NAME?.trim();
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!process.env.MONGO_URI || !name || !email || !password) {
        throw new Error("Set MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env before creating an admin.");
    }
    if (password.length < 12) {
        throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    try {
        const existingAdmin = await adminModel.findOne({ email });
        if (existingAdmin) {
            console.log(`Admin account already exists for ${email}. No changes made.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await adminModel.create({ name, email, password: hashedPassword });
        console.log(`Admin account created for ${email}.`);
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin().catch((error) => {
    console.error("Unable to create admin:", error.message);
    process.exitCode = 1;
});
