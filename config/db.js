const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require('bcryptjs')

require('dotenv').config()

let gfs; 

const createAdminUser = async () => {
    try {
        const existingAdmin = await User.findOne({name: 'admin', role: 'admin'});
        if(!existingAdmin) {
            const hashPassword = await bcrypt.hash('admin',10);
            const adminUser = new User({
                name: 'admin',
                password: hashPassword,
                email: 'admin@gmail.com',
                role: 'admin',
                isVerified: true
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

        // // Initializing GridFS
        // const gridConn = mongoose.createConnection(MONGO_URI)
        // gridConn.once("open", () => {
        //     gfs = Grid(gridConn.db, mongoose.mongo)
        //     gfs.collection("lyrics_photos");
        //     console.log("✅ GridFS Initialized!");
        // })
         // Initialize GridFS
        //  const db = mongoose.connection.db;
        //  gfs = Grid(db, mongoose.mongo);
        //  gfs.collection("lyrics_photos"); // The name of your GridFS bucket
        //  console.log("✅ GridFS Initialized!");

    }catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1); // Exit process with failure
    }
}

// Function to get the GridFS instance
const getGFS = () => {
    if (!gfs) throw new Error("❌ GridFS not initialized!");
    return gfs;
};

module.exports = { connectDB, getGFS };
