const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config()

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if(!token) {
            return res.status(401).json({ error: "Access Denied" });
        } 
        const verified = jwt.verify(token.replace("Bearer ",""),process.env.JWT_SECRET_KEY);
        
        const dbUser = await User.findById(verified.id)
        
        if (!dbUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if(!dbUser.isActive) {
            return res.status(403).json({ message: 'Your account has been deactivated by an admin.' });
        }

        req.user = dbUser;
        next();
    } catch(err) {
        res.status(401).json({ error: "Invalid token" });
    }
}

module.exports={authenticateUser}