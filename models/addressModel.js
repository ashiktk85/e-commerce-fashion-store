
const mongoose  = require("mongoose");

const addressSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    name : {
        type : String,
        required : true,
    },
    mobile : {
        type : Number,
        required : true,
    },
    pincode : {
        type : String,
        required : true,
    },
    locality : {
        type : String
    },
    address : {
        type : String,
        required : true
    },
    city : {
        type : String,
        required : true
    },
    state : {
        type : String,
        required : true
    },
    country : {
        type : String
    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
}, {versionKey : false})

module.exports = mongoose.model("Address", addressSchema);