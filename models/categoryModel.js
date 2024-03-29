const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name : {
        type : String,
        require : true
    },
    description : {
        type : String,
        require : true
    },
    offer: {
        discount : {
            type : Number
        },
        startDate : {
            type : String,
        },
        endDate : {
            type : String,
        }
    },
    is_blocked : {
        type : Boolean,
        default : false
    }
}, {versionKey : false})

module.exports = mongoose.model("category", categorySchema);