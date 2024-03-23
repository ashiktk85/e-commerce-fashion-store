const Wallet  = require('../models/walletModel');
const User = require('../models/userModel');
const crypto = require("crypto");
const Razorpay = require('razorpay')
const generateOrder = require("../controllers/otpGenerator");
const generateTransaction=require('../controllers/transactionId')
const generateDate = require("../controllers/dateGenerator");

//RAZOR PAY FUNCTION

var instance = new Razorpay({
    key_id: "rzp_test_ECB3Zjd1NyXFF9",
    key_secret: "iEgLaQf47PbHbiIodSNL8NvV",
  });

// LOADING WALLET PAGE

const loadWallet = async (req, res) => {
    try {
      const cart=req.session.cart
      const wish=req.session.wish
  
      console.log("WALTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTET");
      const userData = await User.findOne({ email: req.session.email });
      const userWallet = await Wallet.findOne({ userId: userData._id })
        
  
      console.log(userWallet)
        
  
      // console.log(userWallet);
  
      res.render("wallet", { userWallet ,cart,wish});
    } catch (error) {
      console.log(error.message);
    }
  };

  //ADD CASH WALLET

const addCash = async (req, res) => {
    try {

        console.log("getting to add cash wallet");
      const { wallet, id, amount } = req.body;
  
      console.log(wallet);
      console.log(id);
  
      let hmac = crypto.createHmac("sha256", "iEgLaQf47PbHbiIodSNL8NvV");
  
      hmac.update(wallet.razorpay_order_id + "|" + wallet.razorpay_payment_id);
      hmac = hmac.digest("hex");
      if (hmac == wallet.razorpay_signature) {
        const id= generateTransaction()
        const date = generateDate();
        const userData = await User.findOne({ email: req.session.email });
        const userInWallet = await Wallet.findOne({ userId: userData._id });
        if (userInWallet) {
          
          const updateWallet = await Wallet.findByIdAndUpdate(
            { _id: userInWallet._id },
            {
              $inc: {
                balance:amount,
              },
              $push:{
                transactions:{
                  id:id,
                  date:date,
                  amount:amount
                },
              }
            }
          );
        }else{
          
          const newWallet=new Wallet({
            userId:userData._id,
            balance:amount,
            transactions:[
              {
                id:id,
                amount:amount,
                date:date
              }
            ]
          })
  
         await newWallet.save()
        }
      }
  
      res.json({status:true})
    } catch (error) {
      console.log(error.message);
    }
  };

  // ADDING CASH TO WALLET

const addWalletCash = async (req, res) => {
    try {
      const amount = req.body.Amount;
      const orderId = generateOrder.generateOrder();
  
      var options = {
        amount: amount * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
  
      instance.orders.create(options, async (err, razopayWallet) => {
        if (!err) {
          console.log("lllllllllllllllllllllll ", razopayWallet);
          res.json({ status: true, wallet: razopayWallet, Amount: amount });
        } else {
          console.log(err.message);
        }
      });
  
      // console.log(amount)
    } catch (error) {
      console.log(error.message);
    }
  };

module.exports = {
    loadWallet,
    addCash,
    addWalletCash

}