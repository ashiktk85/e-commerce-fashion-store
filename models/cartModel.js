const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
        required : true
    },
    items : [{
        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Products',
            require : true,
        },
        quanity : {
            type : Number
        },
        price : {
            type:Number
        },
        size : {
            type: String,
            required : true
        }
    }], 
    totalPrice : {
        type : Number
    }
},{ timestamps: true, versionKey: false })

module.exports = mongoose.model("Cart", cartSchema)