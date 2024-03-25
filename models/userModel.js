const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        require : true
    },
    email : {
        type : String,
        require : true
    },
    mobile : {
        type : String,
        require : true
    },
    password : {
        type : String,
        require : true
    },
    password : {
        type : String,
        require : true
    },
    is_verified : {
        type : Boolean,
        require : true
    },
    is_blocked : {
        type : Boolean,
        default : false
    },
    referralCode:{
        type:String,
        require:true,
    }
}, {versionKey : false})

module.exports = mongoose.model("User", userSchema)