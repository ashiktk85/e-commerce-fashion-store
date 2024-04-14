// const admin = require('../')
const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Product = require("../models/productModel")
const Category = require('../models/categoryModel')
const color = require('../controllers/colorGenerator');
const adminEmail = process.env.adminEmail;
const adminPassword = process.env.adminPassword;

// ADMIN LOGIN

const adminLogin = async (req, res) => {
    try {
        if (req.session.admin) {
            res.render('adminhome')
        } else {
            res.render('adminLogin')
        }
    } catch (error) {
        console.log(`There was an error in rendering admin login page : ${error}`);
    }
}

//VARIFYING ADMIN LOGIN

const verifyAdmin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        console.log(email);

        if (email == adminEmail && password == adminPassword) {
            req.session.admin = email;
            req.session.admin = password;
            res.redirect('/admin/adminDashboard');
        } else {
            res.json({
                message: "error in pass or email"
            })
        }
    } catch (error) {
        console.log(`There was an error in verifying admin login : ${error}`);
    }
}

// LOADING ADMIN HOME




const adminHome = async (req, res) => {
    try {
        const [user, category, product, order] = await Promise.all([
            User.find({}),
            Category.find({}),
            Product.find({}),

            Order.find({ status: { $in: ["Delivered"] } })
        ]);
        let revenue = 0;
        for (let i = 0; i < order.length; i++) {
            revenue += order[i].totalAmount
        }
        // line chart user line
        const UserdayArray = [0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < user.length; i++) {
            let createddate = new Date(user[i].createdOn);
            createddate = createddate.getDay(); // [sun monday , tue]
            UserdayArray[createddate] += 1;
        };
        // line chart order counting each day
        const orderData = await Order.find({});
        const orderdayArray = [0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < orderData.length; i++) {
            let dateOfOrder = new Date(orderData[i].orderDate);
            dateOfOrder = dateOfOrder.getDay();
            orderdayArray[dateOfOrder] += 1
        };
        // Bar chart weekly revenew
        const revenewDayaArray = new Array(12).fill(0);

        for (let i = 0; i < orderData.length; i++) {
            const order = orderData[i];
            const monthOfOrder = new Date(order.
                orderDate).getMonth();

            if (order.orderType === "Cash on Delivery" &&
                (order.status === "Delivered")) {
                    console.log(order.totalAmount);
                revenewDayaArray[monthOfOrder] += order.totalAmount;
            }

            if (order.orderType === "Razorpay" &&
                (order.status === "Ordered" || order.status === "Shipped" || order.status === "Delivered" ||
                    order.status === "Return process")) {
                        console.log(order.totalAmount);
                revenewDayaArray[monthOfOrder] += order.totalAmount;
            }
        }
        console.log("revenue array : ", revenewDayaArray);

        // top 5 products
        const productCounts = await Order.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.productId", count: { $sum: "$items.quantity" } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const productIds = productCounts.map(item => item._id);

        const top5products = await Product.find({ _id: { $in: productIds } });

        


        // top 5 category
        const productCategoryCounts = await Order.aggregate([
            { $unwind: "$product" },
            { $group: { _id: "$product.categoryName", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, category: "$_id", count: 1 } }
        ]);
        console.log("kghiguyg",productCategoryCounts);
        let productcatList = productCategoryCounts.map(item => item.category);
        for (const categoryItem of category) {
            if (productcatList.length >= 5) break;
            if (!productcatList.includes(categoryItem.name)) {
                productcatList.push(categoryItem.name);
            }
        }


        res.render("adminhome", { user, category, product, order, revenue, UserdayArray, orderdayArray, revenewDayaArray, top5products, productcatList })
    } catch (error) {
        console.log(error);
    }
}

// CAREGORY CHART





// LOADING USER DETAILS PAGE 

const userDetails = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const usersPerPage = 10; 
        const skip = (page - 1) * usersPerPage;

        const totalUsers = await User.countDocuments({});
        const totalPages = Math.ceil(totalUsers / usersPerPage);

        const userDetails = await User.find({})
            .skip(skip)
            .limit(usersPerPage);

        res.render('userDetails', { userDetails, totalPages, currentPage: page });
    } catch (error) {
        console.log(`There was an error in loading user details: ${error}`);
        res.status(500).send("Internal Server Error");
    }
};



// BLOCKING USER

const blockUser = async (req, res) => {
    try {
        const id = req.query.id;
        const findUser = await User.findById({ _id: id });


        if (findUser.is_blocked == false) {
            const userData = await User.updateOne({ _id: id }, { is_blocked: true })
        } res.redirect('/admin/userDetails')
    } catch (error) {
        console.log(`There was an error in blocking user : ${error}`);
    }
}

// UNBLOCKING USER

const unblockUser = async (req, res) => {
    try {
        const id = req.query.id;
        const findUser = await User.findById({ _id: id });
        console.log(findUser);
        if (findUser.is_blocked == true) {
            const userData = await User.updateOne({ _id: id }, { is_blocked: false })

        } res.redirect('/admin/userDetails')
    } catch (error) {
        console.log(`There is an error in unblocking user : ${error}`);
    }
}

// LOADING SALES REPORT

const loadSalesreport = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const ordersPerPage = 10; 
        const skip = (page - 1) * ordersPerPage;

        const order = await Order.find({
            status: { $in: ["Delivered"] },
        })
            .skip(skip)
            .limit(ordersPerPage);

        const calculateOverallSummary = (order) => {
            let salesCount = 0;
            let totalOrderAmount = 0;
            let totalDiscount = 0;

            order.forEach((order) => {
                salesCount++;
                totalOrderAmount += order.totalAmount;
                totalDiscount += order.discount || 0;
            });

            return {
                salesCount,
                totalOrderAmount,
                totalDiscount,
            };
        };

        const overallSummary = calculateOverallSummary(order);

        const totalOrders = await Order.countDocuments({ status: "Delivered" });
        const totalPages = Math.ceil(totalOrders / ordersPerPage);

        res.render('salesReport', { order, overallSummary, totalPages, currentPage: page });
    } catch (error) {
        console.log(`Error in loading sales report: ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
};



// DATE FILTER SALES REPORT
const dateFilter = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const ordersPerPage = 10;
        const skip = (page - 1) * ordersPerPage;

        const date = req.query.value;
        const date2 = req.query.value1;
        console.log(date, "                 ", date2)
        const parts = date.split("-");
        const parts1 = date2.split("-");
        const day = parseInt(parts[2], 10);
        const day1 = parseInt(parts1[2], 10)

        const month = parseInt(parts[1], 10);
        const month1 = parseInt(parts1[1], 10);

        const rotatedDate = day + "-" + month + "-" + parts[0];
        const rotatedDate1 = day1 + "-" + month1 + "-" + parts1[0];


        console.log(rotatedDate, "         ", rotatedDate1)
        // console.log(rotatedDate)

        const order = await Order.find({
            status: { $in: ["Delivered"] },
            orderDate: {
                $gte: rotatedDate,
                $lte: rotatedDate1
            }
        })
            .skip(skip)
            .limit(ordersPerPage);

        const calculateOverallSummary = (orders) => {
            let salesCount = 0;
            let totalOrderAmount = 0;
            let totalDiscount = 0;

            orders.forEach((order) => {
                salesCount++;
                totalOrderAmount += order.totalAmount;
                totalDiscount += order.discount || 0;
            });

            return {
                salesCount,
                totalOrderAmount,
                totalDiscount,
            };
        };

        

        const overallSummary = calculateOverallSummary(order);

        const totalOrders = await Order.countDocuments({
            status: { $in: ["Delivered"] },
            orderDate: {
                $gte: rotatedDate,
                $lte: rotatedDate1
            }
        });
        const totalPages = Math.ceil(totalOrders / ordersPerPage);
        

        res.render('salesReport', { order, overallSummary, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
};


// SORT DATE SALES REPORT
const sortDate = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const ordersPerPage = 10;
        const skip = (page - 1) * ordersPerPage;

        const sort = req.query.value;
        let orderDateQuery = {};

        const currentDate = new Date();

        const currentDateString = `${currentDate.getDate()}-${currentDate.getMonth() + 1
            }-${currentDate.getFullYear()}`;

        if (sort === "Day") {
            orderDateQuery = currentDateString;
        } else if (sort === "Week") {
            const firstDayOfWeek = new Date(currentDate);
            firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const lastDayOfWeek = new Date(currentDate);
            lastDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6);
            const firstDayOfWeekString = `${firstDayOfWeek.getDate()}-${firstDayOfWeek.getMonth() + 1
                }-${firstDayOfWeek.getFullYear()}`;
            const lastDayOfWeekString = `${lastDayOfWeek.getDate()}-${lastDayOfWeek.getMonth() + 1
                }-${lastDayOfWeek.getFullYear()}`;
            orderDateQuery = {
                $gte: firstDayOfWeekString,
                $lte: lastDayOfWeekString,
            };
        } else if (sort === "Month") {
            orderDateQuery = {
                $regex: `-${currentDate.getMonth() + 1}-`,
            };
        } else if (sort === "Year") {
            orderDateQuery = {
                $regex: `-${currentDate.getFullYear()}$`,
            };
        }

        console.log(orderDateQuery);

        const order = await Order.find({
            status: { $in: ["Delivered"] },
            orderDate: orderDateQuery,
        })
            .skip(skip)
            .limit(ordersPerPage);

        const calculateOverallSummary = (orders) => {
            let salesCount = 0;
            let totalOrderAmount = 0;
            let totalDiscount = 0;

            orders.forEach((order) => {
                salesCount++;
                totalOrderAmount += order.totalAmount;
                totalDiscount += order.discount || 0;
            });

            return {
                salesCount,
                totalOrderAmount,
                totalDiscount,
            };
        };

       

        const overallSummary = calculateOverallSummary(order);

        const totalOrders = await Order.countDocuments({
            status: { $in: ["Delivered"] },
            orderDate: orderDateQuery,
        });
        const totalPages = Math.ceil(totalOrders / ordersPerPage);

        res.render('salesReport', { order, overallSummary, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
};




// ADMIN LOGOUT 

const logout = async (req, res) => {
    try {
        delete req.session.admin;
        res.redirect("/admin");
    } catch (error) {
        console.log(error);
    }
};


module.exports = {
    adminHome,
    adminLogin,
    verifyAdmin,
    userDetails,
    blockUser,
    unblockUser,
    logout,
    loadSalesreport,
    sortDate,
    dateFilter,
    
}