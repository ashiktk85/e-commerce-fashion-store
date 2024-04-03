// const admin = require('../')
const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Product = require("../models/productModel")
const Category = require('../models/categoryModel')
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
      const yValues = [0, 0, 0, 0, 0, 0, 0];
      const order = await Order.find({
        status: { $nin: ["Ordered", "Processing", "Canceled", "Shipped"] },
      });
  
      const productQuantityMap = new Map();
  
      order.forEach((order) => {
        order.items.forEach((item) => {
          const productId = item.productId.valueOf();
          const quantity = item.quantity;
          productQuantityMap.set(
            productId,
            (productQuantityMap.get(productId) || 0) + quantity
          );
        });
      });
  
      const productQuantityArray = [...productQuantityMap.entries()].map(
        ([productId, quantity]) => ({ productId, quantity })
      );
  
      productQuantityArray.sort((a, b) => b.quantity - a.quantity);
  
      const allData = await Category.find({});
      const sales = new Array(allData.length).fill(0);
      const allName = allData.map((x) => x.name);
  
      let productId = [];
      let quantity = [];
  
      for (let i = 0; i < order.length; i++) {
        for (let j = 0; j < order[i].items.length; j++) {
          productId.push(order[i].items[j].productId);
          quantity.push(order[i].items[j].quantity);
        }
      }
  
      const productData = [];
      for (let i = 0; i < productId.length; i++) {
        productData.push(await Product.findById(productId[i]));
      }
  
      for (let i = 0; i < productData.length; i++) {
        for (let j = 0; j < allData.length; j++) {
          if (allData[j]._id.toString() === productData[i].category.toString()) {
            sales[j] += quantity[i];
          }
        }
      }
  
      const topProduct = [];
  
      const month = await Order.aggregate([
        {
          $project: {
            _id: { $dateToString: { format: "%m-%Y", date: "$createdAt" } },
            totalAmount: 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            totalEarnings: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
  
      let array = new Array(12).fill(0);
      const months = [
        "01-2024", "02-2024", "03-2024", "04-2024", "05-2024", "06-2024",
        "07-2024", "08-2024", "09-2024", "10-2024", "11-2024", "12-2024",
      ];
  
      for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < month.length; j++) {
          if (month[j]._id === months[i]) {
            array[i] += month[j].totalEarnings;
          }
        }
      }
  
      const orderData = await Order.find({ status: "Delivered" });
      let sum = orderData.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const product = await Product.find({});
      const category = await Category.find({});
  
      if (order.length > 0) {
        const proLength = product.length;
        const catLength = category.length;
        const orderLength = order.length;
        res.render("adminhome", {
          sum,
          proLength,
          catLength,
          orderLength,
          month,
          yValues,
          allName,
          sales,
          productData,
          productQuantityArray,
          topProduct,
          array,
        });
      } else {
        const proLength = product.length;
        const catLength = category.length;
        const orderLength = order.length;
        const month = null;
        res.render("adminDash", {
          sum,
          proLength,
          catLength,
          orderLength,
          month,
          yValues,
          allName,
          sales,
          productData,
          productQuantityArray,
          topProduct,
          array,
        });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  
  

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
            status: { $in : ["Delivered"] },
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