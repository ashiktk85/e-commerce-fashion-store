const express = require("express");
const userRoute = express();

const userController = require("../controllers/userController")
const cartController = require('../controllers/cartController')
const couponController = require('../controllers/couponController')
const userAuth = require('../middleware/auth');
const orderController = require('../controllers/orderController')
const walletController = require('../controllers/walletController')



userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user")


userRoute.get('/', userAuth.isBlocked,userController.home)
userRoute.get('/login', userAuth.isBlocked,userAuth.isLogOut, userController.userLogin)
userRoute.post('/login', userController.verifyLogin)
userRoute.get('/register',userAuth.isLogOut,userController.userSignup)
userRoute.post("/register",userAuth.isLogOut ,userController.userSignupPost)
userRoute.get('/otpVerification',userAuth.isLogOut , userAuth.isLogOut,userController.loadOtp)
userRoute.post('/otpVerification', userAuth.isLogOut,userAuth.isLogOut, userController.verifyOtp)
userRoute.get('/resendOtp',userAuth.isLogOut, userController.resendOtp);
userRoute.get('/forgotPassword',userAuth.isLogOut , userController.forgotPassword)
userRoute.post('/sendOtp',userAuth.isLogOut , userController.sendOtpForgotpass)
userRoute.post('/forgotOtp-post',userAuth.isLogOut , userController.PostForgotpass);
userRoute.get('/forgetpassVerification',userAuth.isLogOut,userController.loadForget);
userRoute.post('/verify-forgotpass', userAuth.isLogOut, userController.verifyForgotpass)
userRoute.get('/productDetails', userAuth.isBlocked,userAuth.isLogin, userController.productDetails)
userRoute.get('/logout', userAuth.isLogin, userController.logOut)


//  Account- Dashboard routes

userRoute.get('/orders',userAuth.isLogin,userAuth.isBlocked, userController.orders)
userRoute.get('/accountDetails',userAuth.isLogin,userAuth.isBlocked, userController.accountDetails)
userRoute.get('/addAddress',userAuth.isLogin,userAuth.isBlocked, userController.addAddress)
userRoute.get('/userAddress',userAuth.isLogin,userAuth.isBlocked, userController.userAddress)
userRoute.post('/postAddress',userAuth.isLogin,userAuth.isBlocked, userController.postAddress)
userRoute.get('/deleteAddress',userAuth.isLogin,userAuth.isBlocked, userController.deleteAddress)
userRoute.get('/editAddress',userAuth.isLogin,userAuth.isBlocked,  userController.editAddress)
userRoute.post('/postEditaddress', userAuth.isLogin,userAuth.isBlocked, userController.postEditaddress)
userRoute.get('/changePassword',userAuth.isLogin,userAuth.isBlocked,  userController.changePassword)
userRoute.post('/change-pass',userAuth.isLogin,userAuth.isBlocked,  userController.changePass)
userRoute.get('/viewAccount',userAuth.isLogin,userAuth.isBlocked,  userController.viewAccount)
userRoute.get('/editAccount',userAuth.isLogin,userAuth.isBlocked,  userController.editAccount)
userRoute.post('/postEditAccount',userAuth.isLogin,userAuth.isBlocked,  userController.postEditAccount)


// cart 
userRoute.get('/cart',userAuth.isLogin, cartController.cartPage)
userRoute.post("/addcartLoad",userAuth.isBlocked,userAuth.isLogin,cartController.loadCart)
userRoute.post("/increment",userAuth.isBlocked,userAuth.isLogin,cartController.increment)
userRoute.post("/decrement",userAuth.isBlocked,userAuth.isLogin,cartController.decrement)
userRoute.get('/cartremove', userAuth.isBlocked,userAuth.isLogin, cartController.removeItemCart)
userRoute.get('/clearCart', userAuth.isBlocked,userAuth.isLogin,cartController.clearCart)




//checkout
userRoute.get('/checkout',userAuth.isLogin,userAuth.isBlocked, cartController.checkout)
userRoute.post("/placeOrder",userAuth.isBlocked,userAuth.isLogin,cartController.placeOrder)
userRoute.get('/orderSuccess',userAuth.isBlocked,userAuth.isLogin, orderController.orderSuccess)
userRoute.post('/verifyPayment', userAuth.isBlocked,userAuth.isLogin,orderController.verifyPayment)
userRoute.post('/paymentFaild', userAuth.isBlocked,userAuth.isLogin,orderController.failedPayment)
userRoute.post("/continue-Payment",userAuth.isBlocked,userAuth.isLogin, orderController.continuePayment)
userRoute.post("/payment-sucess",userAuth.isBlocked,userAuth.isLogin, orderController.successPayment)

// order
userRoute.get("/orderView",userAuth.isBlocked,userAuth.isLogin,orderController.loadViewOrder)
userRoute.post("/cancelOrder",userAuth.isBlocked,userAuth.isLogin,orderController.cancelOrder)
userRoute.post("/return",userAuth.isBlocked,userAuth.isLogin,orderController.returnRequest)
userRoute.post("/cancelReturn",userAuth.isBlocked,userAuth.isLogin,orderController.cancelReturn)
userRoute.get('/invoice', userAuth.isBlocked, userAuth.isLogin, orderController.invoice)

//wallet
userRoute.get('/wallet', userAuth.isLogin,walletController.loadWallet)
userRoute.post("/addCash",userAuth.isBlocked,userAuth.isLogin,walletController.addWalletCash)
userRoute.post("/addAmount",userAuth.isBlocked,userAuth.isLogin,walletController.addCash)

// all products
userRoute.get('/allProducts',userAuth.isBlocked,userAuth.isLogin,userController.allProducts)
userRoute.post("/search",userController.searchProducts)
// userRoute.get("/next-page",userController.nextPage)

//wishlist 
userRoute.get("/wishlist", userAuth.isLogin,userAuth.isBlocked, userController.whishlist)
userRoute.post('/addWishlist', userController.addWishlist)
userRoute.post('/removeWishlist',userController.removeWishlist)

//coupons
userRoute.get('/coupons',userController.loadCoupon)
userRoute.post('/applyCoupon',userAuth.isLogin,couponController.applyCoupon)



module.exports = userRoute;         