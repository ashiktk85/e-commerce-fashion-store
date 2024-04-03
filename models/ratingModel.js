const mongoose = require("mongoose")

const ratingSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        require: true
    },
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    date: {
        type: String,
        require: true
    },
    star: {
        type: Number,
        default: 1
    }
})

module.exports = mongoose.model("Rating", ratingSchema)