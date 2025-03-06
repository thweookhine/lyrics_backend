    const mongoose = require("mongoose")
    require('dotenv').config()

    const connectDB = async () => {

        try {
            const MONGO_URI = process.env.MONGO_URI;
            await mongoose.connect(MONGO_URI)
            console.log("✅ MongoDB Connected Successfully!");
        }catch (err) {
            console.error("❌ MongoDB Connection Error:", err);
            process.exit(1); // Exit process with failure
        }
    }

    module.exports=connectDB