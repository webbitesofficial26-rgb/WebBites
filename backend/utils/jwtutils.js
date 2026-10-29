import jwt from "jsonwebtoken";
import secretKey from "../jwtconfig.js";

const generateToken = (user, role) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: role
    };

    return jwt.sign(payload, secretKey,{expiresIn: "24h"});
};

export default generateToken;