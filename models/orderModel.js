const mongoose = require("mongoose")

const order_schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    userEmail: {
        type: String,
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required: true,
        },
        quantity: {
            type: Number
        },
        subTotal: {
            type: Number,
            required: true,
        },
        size: {
            type: String,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    orderType: {
        type: String,
        required: true
    },
    orderDate: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    reason : {
        type : String,
    },
    shippingAddress: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        name: {
            type: String,
            required: true,
        },
        mobile: {
            type: Number,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
        locality: {
            type: String
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    },
    coupon: {
        type: String,
    },
    discount: {
        type: Number,
    }
}, { versionKey: false });


const order = mongoose.model("order", order_schema)
module.exports = order