
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


const cartPage = async (req ,res) => {
    try {
        const proData = await Product.find({})
        const cartData =  await User.find({})
        console.log("loading cart page");
        res.render('cart',{cartData, proData})
    } catch (error) {
        console.log(`Error in adding cart data : ${error}`);
        
    }
}  

// CART POST DATA



// ADD TO CART
const loadCart = async (req ,res) => {
    try {
        console.log("getting to load carttttttttttttttttttttttttttttt");
        const {id ,proPrice} = req.body
        console.log(req.body);
    } catch (error) {
        console.log(`Error in adding cart data : ${error}`);
        
    }
}  



// LOADING CHEKOUT PAGE

const checkout = async (req, res) => {
    try {
        res.render('checkout')
    } catch (error) {
        console.log(`error in loading checkout page : ${error}`);
    }
}

module.exports = {
    
    checkout,
    loadCart,
    cartPage
   
}