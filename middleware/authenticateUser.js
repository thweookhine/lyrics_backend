const jwt = require('jsonwebtoken')
require('dotenv').config()

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if(!token) {
            return res.status(401).json({ error: "Access Denied" });
        } 
        const verified = jwt.verify(token.replace("Bearer ",""),process.env.JWT_SECRET_KEY);
        req.user = verified;
        next();
    } catch(err) {
        res.status(401).json({ error: "Invalid token" });
    }
}

module.exports={authenticateUser}