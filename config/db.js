const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require('bcryptjs')

require('dotenv').config()

let gfs; 

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        await mongoose.connect(MONGO_URI)
        console.log("✅ MongoDB Connected Successfully!");
        // await createAdminUser()

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
