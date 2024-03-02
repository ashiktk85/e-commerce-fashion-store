const express = require("express");
const userRoute = express();

const userController = require("../controllers/userController")
const cartController = require('../controllers/cartController')
const userAuth = require('../middleware/auth');



userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user")


userRoute.get('/', userAuth.isBlocked,userController.home)
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
userRoute.get('/accountDetails',userAuth.isLogin, userController.accountDetails)
userRoute.get('/addAddress',userAuth.isLogin, userController.addAddress)
userRoute.get('/userAddress',userAuth.isLogin, userController.userAddress)
userRoute.post('/postAddress',userAuth.isLogin, userController.postAddress)
userRoute.get('/deleteAddress',userAuth.isLogin, userController.deleteAddress)
userRoute.get('/editAddress', userController.editAddress)
userRoute.post('/postEditaddress', userController.postEditaddress)
userRoute.get('/changePassword', userController.changePassword)
userRoute.get('/viewAccount', userController.viewAccount)
userRoute.get('/editAccount', userController.editAccount)
userRoute.post('/postEditAccount', userController.postEditAccount)


// cart 

userRoute.get('/cart',userAuth.isLogin, cartController.cartPage)

//checkout
userRoute.get('/checkout',userAuth.isLogin, cartController.checkout)

// all products

userRoute.get('/allProducts',userController.allProducts)


module.exports = userRoute;         