const Order = require('../models/orderModel');
const Product = require("../models/productModel")

const loadOrder = async (req, res) => {
    try {
      const orderData = await Order.find({}).sort({ _id: -1 });
  
      res.render("adminOrders", { orderData });
    } catch (error) {
      console.log(error.message);
    }
  };

  const loadOrderDetail = async (req, res) => {
    try {
      const id = req.query.id;
      const findOrder = await Order.findById({ _id: id });
  
      let proId = [];
      for (let i = 0; i < findOrder.items.length; i++) {
        proId.push(findOrder.items[i].productId);
      }
  
      let proData = [];
  
      for (let i = 0; i < proId.length; i++) {
        proData.push(await Product.findById({ _id: proId[i] }));
      }
  
      res.render("detailOrder", { findOrder, proData });
    } catch (error) {
      console.log(error.message);
    }
  };

//   const saveOrder = async (req, res) => {
//     try {
//       const { status, id } = req.body;
  
//       console.log(id, status);
  
//       const checking = await Order.findById({ _id: id });
  
//       if (checking.status == status) {
//         res.json({ status: "notChanged" });
//       } else {
//         const updateStatus = await Order.findByIdAndUpdate(
//           { _id: id },
//           {
//             $set: {
//               status: status,
//             },
//           }
//         );
//       }
//       if (status == "Returned") {
//         const proId = [];
  
//         for (let i = 0; i < checking.items.length; i++) {
//           proId.push(checking.items[i].productId);
//         }
  
//         for (let i = 0; i < proId.length; i++) {
//           await Product.findByIdAndUpdate(
//             { _id: proId[i] },
//             {
//               $inc: {
//                 quantity: checking.items[i].quantity,
//               },
//             }
//           );
//         }
//       } else if (status == "Canceled") { 
//         // const findUser = await User.findOne({ email: req.session.email });
//         const findOrder=await Order.findById({_id:id})
//         if(findOrder.orderType=="COD"){
  
//           const updateOrder = await Order.findByIdAndUpdate(
//             { _id: id },
//             {
//               $set: {
//                 status: "Canceled",
//               },
//             }
//           );
    
//           const proId = [];
    
//           for (let i = 0; i < findOrder.items.length; i++) {
//             proId.push(findOrder.items[i].productId);
//           }
    
//           for (let i = 0; i < proId.length; i++) {
//             await Product.findByIdAndUpdate(
//               { _id: proId[i] },
//               {
//                 $inc: {
//                     quantity: findOrder.items[i].quantity,
//                 },
//               }
//             );
//           }
  
//         }

//       }
  
//       res.json({ status: true });
//     } catch (error) {
//       console.log(error.message);
//     }
//   };

const saveOrder = async (req, res) => {
    try {
        console.log("getting here");
      const { status, id } = req.body;
  
      console.log(id, status);
  
      const order = await Order.findById(id);
      const prosize = order.items[0].size;
      const size = prosize.toLowerCase()

  
      if (!order) {
        return res.status(404).json({ status: "error", message: "Order not found" });
      }

      if (order.status === status) {
        return res.json({ status: "notChanged" });
      }
  
      await Order.findByIdAndUpdate(id, { $set: { status: status } });
  
     
      if (status === "Canceled") {
        if (order.orderType === "COD") {
          const proId = order.items.map(item => item.productId);

          for (let i = 0; i < proId.length; i++) {
            await Product.findByIdAndUpdate(proId[i], {
              $inc: { size: size.quantity }
            });
          }
        }
      }
  
      res.json({ status: true });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  };
  
  module.exports = {
    loadOrder,
    loadOrderDetail,
    saveOrder
  }