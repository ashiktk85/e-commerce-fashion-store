const express = require("express");
const userRoute = express();

const userController = require("../controllers/userController")
const cartController = require('../controllers/cartController')
const userAuth = require('../middleware/auth');



userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user")


userRoute.get('/', userAuth.isBlocked,userController.home)
userRoute.get('/login', userAuth.isBlocked,userAuth.isLogOut, userController.userLogin)
userRoute.post('/login', userController.verifyLogin)
userRoute.get('/register',userAuth.isLogOut, userAuth.isLogOut,userController.userSignup)
userRoute.post("/register",userAuth.isLogOut ,userAuth.isLogOut,userController.userSignupPost)
userRoute.get('/otpVerification',userAuth.isLogOut , userAuth.isLogOut,userController.loadOtp)
userRoute.post('/otpVerification', userAuth.isLogOut,userAuth.isLogOut, userController.verifyOtp)
userRoute.get('/resendOtp',userAuth.isLogOut, userController.resendOtp);
userRoute.get('/forgotPassword',userAuth.isLogOut ,userAuth.isLogOut, userController.forgotPassword)
userRoute.post('/forgotPassword',userAuth.isLogOut ,userAuth.isLogOut, userController.PostForgotpass);
userRoute.get('/productDetails', userAuth.isBlocked, userController.productDetails)
userRoute.get('/logout', userAuth.isLogin, userController.logOut)


                
// userRoute.post('/otpPost',userAuth.isLogOut ,userController.getOtp)


//  Account- Dashboard routes

userRoute.get('/orders',userAuth.isLogin, userController.orders)
userRoute.get('/accountDetails',userAuth.isLogin, userController.accountDetails)
userRoute.get('/addAddress',userAuth.isLogin, userController.addAddress)
userRoute.get('/userAddress',userAuth.isLogin, userController.userAddress)
userRoute.post('/postAddress',userAuth.isLogin, userController.postAddress)
userRoute.get('/deleteAddress',userAuth.isLogin, userController.deleteAddress)
userRoute.get('/editAddress',userAuth.isLogin,  userController.editAddress)
userRoute.post('/postEditaddress', userAuth.isLogin, userController.postEditaddress)
userRoute.get('/changePassword',userAuth.isLogin,  userController.changePassword)
userRoute.get('/viewAccount',userAuth.isLogin,  userController.viewAccount)
userRoute.get('/editAccount',userAuth.isLogin,  userController.editAccount)
userRoute.post('/postEditAccount',userAuth.isLogin,  userController.postEditAccount)


// cart 

userRoute.get('/cart',userAuth.isLogin, cartController.cartPage)
// userRoute.post('/loadCart', userAuth.isLogin, cartController.loadCart)
userRoute.post("/addcartLoad",userAuth.isBlocked,userAuth.isLogin,cartController.loadCart)

//checkout
userRoute.get('/checkout',userAuth.isLogin, cartController.checkout)

// all products

userRoute.get('/allProducts',userController.allProducts)


module.exports = userRoute;         