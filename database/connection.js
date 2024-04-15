require('dotenv').config();


const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        // mongoose.connect("mongodb://localhost:27017/kevinhills")
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Database successfully connected : ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectDB;

