// const admin = require('../')
const User = require('../models/userModel')
const Order = require('../models/orderModel')
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
        res.render('adminhome');
    } catch (error) {
        console.log(`There was an error in loading admin dashboard : ${error}`);
    }
}

// LOADING USER DETAILS PAGE 

const userDetails = async (req, res) => {
    try {
        const userDetails = await User.find({});
        // console.log(userDetails);
        res.render('userDetails', { userDetails })
    } catch (error) {
        console.log(`There was an error in loading user details : ${error}`);
    }
}

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
        
        const order = await Order.find({
            status: { $nin: ["Ordered", "Canceled", "Shipped"] },
        });

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

        res.render('salesReport', { order, overallSummary }); 
    } catch (error) {
        console.log(`error in loading sales report : ${error.message}`);
    }
}

// DATE FILTER SALES REPORT

const dateFilter = async (req, res) => {
    try {
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
            status: { $nin: ["Ordered", "Canceled", "Shipped"] },
            orderDate: {
                $gte: rotatedDate,
                $lte: rotatedDate1
            }
        });
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

       
        const orders = await Order.find({});

        
        const overallSummary = calculateOverallSummary(orders);

        res.render('salesReport', { order ,overallSummary })
    } catch (error) {
        console.log(error.message);
    }
};


// SORT DATE SALES REPORT

const sortDate = async (req, res) => {
    try {
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
            status: { $nin: ["Ordered", "Canceled", "Shipped"] },
            orderDate: orderDateQuery,
        });

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

        
        const orders = await Order.find({});

      
        const overallSummary = calculateOverallSummary(orders);

        res.render('salesReport', { order ,overallSummary })
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
    dateFilter
}