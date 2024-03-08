
const User = require("../models/userModel");
const otpGnerator = require("./otpGenerator");
const otp = require("./otpGenerator");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Address = require("../models/addressModel")
const Cart = require("../models/cartModel")

// LOADING CART PAGE


const cartPage = async (req, res) => {
    try {
      const email = req.session.email;
      // const userData = req.
      const userData = await User.findOne({ email: email });
  
      const cartData = await Cart.findOne({ userId: userData._id });
      const proData = [];
  
      if (cartData) {
  
        const arr = [];
  
        for (let i = 0; i < cartData.items.length; i++) {
          arr.push(cartData.items[i].productId.toString());
        }
        // console.log(arr);
      
        for (let i = 0; i < arr.length; i++) {
          proData.push(await Product.findById({ _id: arr[i] }));
        }
  
        // console.log(proData);
  
       
      }
      console.log(proData);
      console.log(cartData)
  
    //   console.log(proData,cartData)
      res.render("cart", { proData, cartData });
  
      // console.log(cartData)
    } catch (error) {
      console.log(error.message);
    }
  };





// ADD TO CART post loading
const loadCart = async (req, res) => {
    try {
        console.log("getting to load carttttttttttttttttttttttttttttt");
        const { id, proPrice, selectedSize } = req.body;
        const price = parseInt(proPrice);

        if (req.session.email) {
            const userData = await User.findOne({ email: req.session.email });
            const userCart = await Cart.findOne({ userId: userData._id });
            const proData = await Product.findById({ _id: id });
            console.log(userCart);

            if (userCart) {
                let proCart = false;
                console.log("usercart");
                for (let i = 0; i < userCart.items.length; i++) {
                    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
                    if (id == userCart.items[i].productId && selectedSize == userCart.items[i].size) {
                        console.log("product in userCart");
                        proCart = true;
                        break;
                    }
                }
                if (proCart) {
                    console.log("jjjjjjjjsii");
                    res.json({ status: "viewCart" });
                } else {
                    console.log("view cart else");
                    await Cart.findOneAndUpdate(
                        { userId: userData._id },
                        {
                            $push: {
                                items: {
                                    productId: id,
                                    subTotal: proPrice,
                                    quantity: 1,
                                    size: selectedSize,
                                },
                            },
                            $inc: {
                                totalPrice: proPrice,
                            },
                        }
                    );
                }
                
            } else {
                console.log("big if else");
                const cartData = new Cart({
                    userId: userData._id,
                    items: [
                        {
                            productId: id,
                            subTotal: proPrice,
                            quantity: 1,
                            size: selectedSize,
                        },
                    ],
                    totalPrice: proPrice,
                });
                await cartData.save();
            }

        
            res.json({ status: true });
        } else {
            res.json({ status: "login" });
        }
    } catch (error) {
        console.log(`Error in adding cart data: ${error}`);
        
        res.status(500).json({ error: "Internal Server Error" });
    }
};



//ADD CART REAL

const addCart = async(req , res) => {
    try {
        console.log("carrttttyyyyyyyyy");
        const {offerprice, proId, qty, subtotal,sizeS} = req.body;
        console.log(offerprice, proId, qty, subtotal,sizeS)
        
         //  console.log("hello             "+proId);
    const quantity = parseInt(qty);
    console.log(quantity);
    const proIdString = proId.toString();

    const proData = await Product.findById({ _id: proId });
    console.log(proData)
    console.log("uuuuuuuuusssssssssssssserrrrrrrrrrrrrrrr"+req.session.userId)

    console.log(proData);
    const sizeLower=sizeS.toLowerCase()
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh"+sizeLower)

    // const stock = proData.size.sizeLower.quantity;
    // console.log(stock)

    // if (stock > quantity) {
    //   if (quantity < 10) {
        const addPrice = await Cart.findOneAndUpdate(
          { userId: req.session.userId, "items.productId": proIdString },
          {
            $inc: {
              "items.$.price": offerprice,
              "items.$.quantity": 1,
              "items.$.subTotal": offerprice,
              totalPrice: offerprice,
            },
          }
        );

        const findCart = await Cart.findOne({ userId: req.session.userId });

        res.json({ status: true, total: findCart.totalPrice });
        console.log("suuceeeeeeeeeeeeeeeeeeeeeeeeees")
    
    //   else {
    //     res.json({ status: "minimum" });
    //   }
    // } else {
    //   console.log("out os stocccccccccccck");
    //   res.json({ status: "stock" });
    // }
        

    } catch (error) {
      console.log(`error in add cart real ${error}`);  
    }
}


const decrement = async (req, res) => {
    try {
      const {offerprice, proId, qty, subtotal,sizeS } = req.body;
      console.log(offerprice, proId, qty, subtotal,sizeS);
      const proIdString = proId.toString();
      const quantity = parseInt(qty);
  
      if (quantity > 1) {
        const addPrice = await Cart.findOneAndUpdate(
            { userId: req.session.userId, "items.productId": proIdString },
            {
              $inc: {
                "items.$.price": -offerprice,
                "items.$.quantity": -1,
                "items.$.subTotal": -offerprice,
                totalPrice:-offerprice,
              },
            }
          );
  
        const findCart = await Cart.findOne({ userId: req.session.userId });
  
        res.json({ status: true, total: findCart.totalPrice });
      } else {
        res.json({ status: "minimum" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };



// LOADING CHEKOUT PAGE

const checkout = async (req, res) => {
    try {
        const userId = req.session.userId;
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
  
        const cartData = await Cart.findOne({ userId: userData._id });
     
        const userAddress = await Address.find({ userId })
        const quantity = [];

        for (let i = 0; i < cartData.items.length; i++) {
          quantity.push(cartData.items[i].quantity);
        }
    
        const proId = [];
        for (let i = 0; i < cartData.items.length; i++) {
          proId.push(cartData.items[i].productId);
        }
        const proData = [];
    
        for (let i = 0; i < proId.length; i++) {
          proData.push(await Product.findById({ _id: proId[i] }));
        }
    
       
    
        res.render('checkout',{userAddress,cartData,proData})
    } catch (error) {
        console.log(`error in loading checkout page : ${error}`);
    }
}

const placeOrder=async(req,res)=>{
    try {
        const{ selectedAddress, paymentMethod}=req.body
        console.log(selectedAddress, paymentMethod)
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    
    checkout,
    loadCart,
    cartPage,
    addCart,
    decrement,
    placeOrder
   
}