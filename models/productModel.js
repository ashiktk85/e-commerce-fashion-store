const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    discripiton: {
        type: String,
        require: true
    },
    regularPrice: {
        type: Number,
        require: true
    },
    offerPrice: {
        type: Number,
        require: true
    },
    offPercentage: {
        type: Number,
        require: true
    },
    image: {
        type: Array,
        require: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Category',
        require: true
    },
    brand: {
        type: String,
        require: true
    },
    size: {
        s: {
            quantity: {
                type: Number,
                required: true
            }
        },
        m: {
            quantity: {
                type: Number,
                required: true
            }
        },
        l: {
            quantity: {
                type: Number,
                required: true
            }
        }
    }

    , is_blocked: {
        type: Boolean,
        require: true
    }

}, { versionKey: false })

module.exports = mongoose.model("product", productSchema)