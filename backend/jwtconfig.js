import "dotenv/config";

const secretKey = process.env.JWT_SECRET;

if (!secretKey || !secretKey.trim()) {
    throw new Error("JWT_SECRET is missing. Add a private secret to backend/.env before starting WebBites.");
}

export default secretKey;
