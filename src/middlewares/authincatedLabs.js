const jwt = require("jsonwebtoken");
require('dotenv').config();

const JWT_SECRET = process.env.jwt_secret_key;

const authenticateLab = (req, res, next) => {
    console.log('JWT_SECRET:', JWT_SECRET); // Debug line
    const token = req.header("Authorization");
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    if (!JWT_SECRET) {
        return res.status(500).json({ error: "Server configuration error: JWT secret not provided" });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
        if (decoded.role !== "lab") {
            return res.status(403).json({ error: "Unauthorized role." });
        }

        req.lab = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(400).json({ error: "Invalid token.", details: err.message });
    }
};

module.exports = authenticateLab;