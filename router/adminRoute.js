const express = require("express");
const adminRoute = express();

const adminController = require('../controllers/adminController')
const CategoryControler = require("../controllers/categoryController");
const productController = require ('../controllers/productController')
const proUpload = require('../multer/multer')

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin")



const isAdmin = require("../middleware/adminAuth");



adminRoute.get('/', adminController.adminLogin)
adminRoute.post('/adminLogin', adminController.verifyAdmin)
adminRoute.get('/adminDashboard',isAdmin, adminController.adminHome);
adminRoute.get('/userDetails',isAdmin, adminController.userDetails)
adminRoute.get("/block-user", isAdmin, adminController.blockUser);
adminRoute.get("/unblock-user", isAdmin, adminController.unblockUser);



//************** category ******************* */

adminRoute.get('/category',isAdmin, CategoryControler.loadCategory)
adminRoute.post('/category', isAdmin, CategoryControler.addCategory)
adminRoute.post("/cat-list", isAdmin, CategoryControler.listCat);
adminRoute.get("/cat-edit", isAdmin,CategoryControler.loadEdit)
adminRoute.post("/editCategoryPost", isAdmin, CategoryControler.editCat);
adminRoute.post("/cat-cancel",isAdmin, CategoryControler.cancelCat)

//***************** product  ******************************/

adminRoute.get('/adminProduct', isAdmin , productController.loadProduct)
adminRoute.get('/addProduct', isAdmin, productController.loadAddpro)
adminRoute.post('/addProduct', isAdmin, proUpload.array("image",5), productController.addProduct )
adminRoute.get('/edit-pro', isAdmin, productController.loadEdit)
adminRoute.post('/edit-pro', isAdmin, proUpload.array("image",5), productController.editPro)
adminRoute.get('/block-pro', isAdmin, productController.blockPro)
adminRoute.get('/unblock-pro', isAdmin, productController.unblockPro)



module.exports = adminRoute;