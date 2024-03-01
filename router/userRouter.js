const express = require("express");
const userRoute = express();

const userController = require("../controllers/userController")
const userAuth = require('../middleware/auth');



userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user")


userRoute.get('/',userController.home)
userRoute.get('/login', userAuth.isBlocked, userController.userLogin)
userRoute.post('/login', userController.verifyLogin)
userRoute.get('/register',userAuth.isLogOut, userController.userSignup)
userRoute.post("/register",userAuth.isLogOut ,userController.userSignupPost)
userRoute.get('/otpVerification',userAuth.isLogOut , userController.loadOtp)
userRoute.post('/otpVerification', userAuth.isLogOut, userController.verifyOtp)
userRoute.get('/resendOtp', userController.resendOtp);
userRoute.get('/forgotPassword',userAuth.isLogOut , userController.forgotPassword)
userRoute.post('/forgotPassword',userAuth.isLogOut , userController.PostForgotpass);
userRoute.get('/productDetails', userAuth.isBlocked, userController.productDetails)


                
// userRoute.post('/otpPost',userAuth.isLogOut ,userController.getOtp)


//  Account- Dashboard routes

userRoute.get('/orders', userController.orders)
userRoute.get('/accountDetails', userController.accountDetails)
userRoute.get('/addAddress', userController.addAddress)
userRoute.get('/userAddress', userController.userAddress)
userRoute.post('/postAddress', userController.postAddress)
userRoute.get('/deleteAddress', userController.deleteAddress)
userRoute.get('/editAddress', userController.editAddress)
userRoute.post('/postEditaddress', userController.postEditaddress)
userRoute.get('/changePassword', userController.changePassword)
userRoute.get('/viewAccount', userController.viewAccount)
userRoute.get('/editAccount', userController.editAccount)
userRoute.post('/postEditAccount', userController.postEditAccount)


module.exports = userRoute;         