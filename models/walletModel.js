const mongoose = require('mongoose')

const walletSchma=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        require:true,
    },
    balance:{
        type:Number,
        
    },
    transactions:[
        {   id:{
            type:Number
            
            },
            date:{
                type:String,
                
            },
             amount:{
                type:Number,
             
             },
             orderType:{
                type:String,
                
             }
        },
    ],
    

},{versionKey:false})

module.exports = mongoose.model('Wallet',walletSchma)