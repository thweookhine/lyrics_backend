const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require('bcryptjs')
require('dotenv').config()

const createAdminUser = async () => {
    try {
        const existingAdmin = await User.findOne({name: 'admin', role: 'admin'});
        if(!existingAdmin) {
            const hashPassword = await bcrypt.hash('admin',10);
            const adminUser = new User({
                name: 'admin',
                password: hashPassword,
                email: 'admin@gmail.com',
                role: 'admin'
            })

            await adminUser.save();
            console.log('Admin user created successfully.');
        }else {
            console.log('Admin user already exists.');
        }
    }catch  (error) {
        console.error('Error creating admin user:', error);
    }
}

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        await mongoose.connect(MONGO_URI)
        console.log("✅ MongoDB Connected Successfully!");
        await createAdminUser()
    }catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1); // Exit process with failure
    }
}

module.exports=connectDB