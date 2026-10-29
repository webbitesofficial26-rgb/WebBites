import bcrypt from "bcrypt";
import adminModel from "../models/adminModel.js";
import generateToken from "../utils/jwtutils.js";


export const adminLogin = async (req, res) => {
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

        // Find admin
        const admin = await adminModel.findOne({
            email: normalizedEmail,
        });

        if (!admin) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: 0,
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: 0,
            });
        }

        // Generate admin token
        const token = generateToken(admin, "admin");

        return res.status(200).json({
            message: "Admin login successful",
            status: 1,
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
            token,
        });

    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            message: "Admin login failed",
            status: 0,
        });
    }
};

