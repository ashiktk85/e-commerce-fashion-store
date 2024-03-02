
const User = require("../models/userModel");
const otpGnerator = require("./otpGenerator");
const otp = require("./otpGenerator");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Address = require("../models/addressModel")

// LOADING CART PAGE

const cartPage = async(req, res) => {
    try {
        res.render('cart')
    } catch (error) {
        console.log(`error in loading cart page : ${error}`);
    }
}

// LOADING CHEKOUT PAGE

const checkout = async(req, res) => {
    try {
        res.render('checkout')
    } catch (error) {
        console.log(`error in loading checkout page : ${error}`);
    }
}

module.exports = {
    cartPage,
    checkout
}