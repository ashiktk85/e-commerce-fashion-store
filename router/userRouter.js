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
userRoute.get('/productDetails', userAuth.isBlocked,userAuth.isLogin, userController.productDetails)
userRoute.get('/logout', userAuth.isLogin, userController.logOut)


                
// userRoute.post('/otpPost',userAuth.isLogOut ,userController.getOtp)


//  Account- Dashboard routes

userRoute.get('/orders',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked, userController.orders)
userRoute.get('/accountDetails',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked, userController.accountDetails)
userRoute.get('/addAddress',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked, userController.addAddress)
userRoute.get('/userAddress',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked, userController.userAddress)
userRoute.post('/postAddress',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked, userController.postAddress)
userRoute.get('/deleteAddress',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked, userController.deleteAddress)
userRoute.get('/editAddress',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked,  userController.editAddress)
userRoute.post('/postEditaddress', userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked, userController.postEditaddress)
userRoute.get('/changePassword',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked,  userController.changePassword)
userRoute.post('/change-pass',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked,  userController.changePass)
userRoute.get('/viewAccount',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked,  userController.viewAccount)
userRoute.get('/editAccount',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked,  userController.editAccount)
userRoute.post('/postEditAccount',userAuth.isLogin,userAuth.isLogOut,userAuth.isBlocked,  userController.postEditAccount)

// cart 

userRoute.get('/cart',userAuth.isLogin, cartController.cartPage)
userRoute.post("/addcartLoad",userAuth.isBlocked,userAuth.isLogin,cartController.loadCart)
userRoute.post("/cartadd",userAuth.isBlocked,userAuth.isLogin,cartController.addCart)
userRoute.post("/decrement",userAuth.isBlocked,userAuth.isLogin,cartController.decrement)
userRoute.post("/placeOrder",userAuth.isBlocked,userAuth.isLogin,cartController.placeOrder)
userRoute.get('/cartremove', userAuth.isBlocked,userAuth.isLogin, cartController.removeItemCart)
userRoute.get('/clearCart', userAuth.isBlocked,userAuth.isLogin,cartController.clearCart)

//checkout
userRoute.get('/checkout',userAuth.isLogin,userAuth.isBlocked, cartController.checkout)

// all products

userRoute.get('/allProducts',userAuth.isBlocked,userAuth.isLogin,userAuth.isLogOut,userController.allProducts)



module.exports = userRoute;         