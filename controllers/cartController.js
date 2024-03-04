
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

        console.log("getting to cart pageeeeeeeeeeeeeee");
        const email = req.session.email;
        console.log(email);

        const userData = await User.findOne({ email: email })

        const cartData = await Cart.findOne({ userId : userData._id })
        

        const proData = [];

        if (cartData) {
            const arr = [];

            for (let i = 0; i < cartData.items.length; i++) {
                arr.push(cartData.items[i].productID.toString())
            }
            console.log("cartttttt : ", arr);

            for (let i = 0; i < arr.length; i++) {
                proData.push(await Product.findById({ _id: arr[i] }))
            }

            console.log(proData);
        }
        
        
        console.log(proData, cartData)
        res.render("cart", { proData, cartData });
    } catch (error) {
        console.log(`error in loading cart page : ${error}`);
    }
}

// CART POST DATA

const loadCart = async (req, res) => {
    try {
        const id = req.body.id;
        const price = req.body.proPrice;

        // Other necessary processing...

        if (req.session.email) {
            const userData = await User.findOne({ email: req.session.email });
            const userCart = await Cart.findOne({ userId: userData._id });

            if (userCart) {
                let proCart = false;

                for (let i = 0; i < userCart.items.length; i++) {
                    if (id === userCart.items[i].productsId) {
                        proCart = true;
                        break;
                    }
                }

                if (proCart) {
                    res.json({ status: "viewCart" });
                } else {
                    const updateCart = await Cart.findOneAndUpdate(
                        { userId: userData._id },
                        {
                            $push: {
                                items: {
                                    productsId: id,
                                    subTotal: priceOFF,
                                    quantity: 1,
                                },
                            },
                            $inc: {
                                total: priceOFF,
                            },
                        }
                    );
                    // Handle the response or additional logic here...
                }
            } else {
                const carData = new Cart({
                    userId: userData._id,
                    items: [
                        {
                            productsId: id,
                            subTotal: priceOFF,
                            quantity: 1,
                        },
                    ],
                    total: priceOFF,
                });

                const cart = await carData.save();
                // Handle the response or additional logic here...
            }

            res.json({ status: true });
        } else {
            res.json({ status: "login" });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: "error" });
    }
};


// LOADING CHEKOUT PAGE

const checkout = async (req, res) => {
    try {
        res.render('checkout')
    } catch (error) {
        console.log(`error in loading checkout page : ${error}`);
    }
}

module.exports = {
    cartPage,
    checkout,
    loadCart
}