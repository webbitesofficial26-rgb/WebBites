import jwt from "jsonwebtoken";
import secretKey from "../jwtconfig.js";

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const match = typeof authHeader === "string"
        ? authHeader.match(/^Bearer\s+(\S+)$/i)
        : null;

    if (!match) {
        return res.status(401).json({ message: "A valid Bearer token is required", status: 0 });
    }

    try {
        req.user = jwt.verify(match[1], secretKey);
        return next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token", status: 0 });
    }
};

export default authMiddleware;
