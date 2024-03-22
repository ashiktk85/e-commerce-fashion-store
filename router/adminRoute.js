const express = require("express");
const adminRoute = express();

const adminController = require('../controllers/adminController')
const CategoryControler = require("../controllers/categoryController");
const productController = require ('../controllers/productController')
const orderController = require("../controllers/orderController")
const proUpload = require('../multer/multer')
const couponController = require("../controllers/couponController")

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin")



const isAdmin = require("../middleware/adminAuth");

// ADMIN HOME

adminRoute.get('/', adminController.adminLogin)
adminRoute.post('/adminLogin', adminController.verifyAdmin)
adminRoute.get('/adminDashboard',isAdmin, adminController.adminHome);
adminRoute.get('/userDetails',isAdmin, adminController.userDetails)
adminRoute.get("/block-user", isAdmin, adminController.blockUser);
adminRoute.get("/unblock-user", isAdmin, adminController.unblockUser);
adminRoute.get("/logout", isAdmin, adminController.logout);



// CATEGORY

adminRoute.get('/category',isAdmin, CategoryControler.loadCategory)
adminRoute.post('/category', isAdmin, CategoryControler.addCategory)
adminRoute.post("/cat-list", isAdmin, CategoryControler.listCat);
adminRoute.get("/cat-edit", isAdmin,CategoryControler.loadEdit)
adminRoute.post("/editCategoryPost", isAdmin, CategoryControler.editCat);
adminRoute.post("/cat-cancel",isAdmin, CategoryControler.cancelCat)

// PRODUCT

adminRoute.get('/adminProduct', isAdmin , productController.loadProduct)
adminRoute.get('/addProduct', isAdmin, productController.loadAddpro)
adminRoute.post('/addProduct', isAdmin, proUpload.array("image",5), productController.addProduct )
adminRoute.get('/edit-pro', isAdmin, productController.loadEdit)
adminRoute.post('/edit-pro/:id', isAdmin, proUpload.array("image",5), productController.editPro)
adminRoute.get('/block-pro', isAdmin, productController.blockPro)
adminRoute.get('/unblock-pro', isAdmin, productController.unblockPro)
adminRoute.get('/edit-detailedView', isAdmin, productController.detailedPro)


//  ORDERS

adminRoute.get("/adminOrders",isAdmin,orderController.loadOrder)
adminRoute.get("/order-Detail",isAdmin,orderController.loadOrderDetail)
adminRoute.post("/orderSave",isAdmin,orderController.saveOrder)

// COUPON

adminRoute.get("/adminCoupon",isAdmin,couponController.loadCouponPage)
adminRoute.get("/addCoupon",isAdmin,couponController.addCouponLoad)
adminRoute.post("/addCoupon",isAdmin,couponController.addCoupon)
adminRoute.post("/coupon-block",isAdmin,couponController.blockCoupon)
adminRoute.get("/coupon-edit",isAdmin,couponController.editCouponpage)
adminRoute.post("/editCoupon",isAdmin,couponController.editCoupon)

// SALES 

adminRoute.get('/salesReport', isAdmin, adminController.loadSalesreport)


module.exports = adminRoute;