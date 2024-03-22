const Order = require('../models/orderModel');
const Product = require("../models/productModel")
const Address = require('../models/addressModel')
const Coupon = require('../models/couponModel')

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

// ORDER SUCCESS PAGE

const orderSuccess = async (req, res) => {
  try {
    res.render('orderSuccess')
  } catch (error) {
    console.log(`error in order success page ${error.message}`);
  }
}

// VERIFYING RAZOR PAYMENT 

const verifyPayment = async (req, res) => {
  try {

console.log("getting to razor verifyyyyy....");
    const { payment, order, selectedSize, order_id, amount, couponCode } = req.body;
    console.log(req.body);
    const findCoupon = await Coupon.findOne({ couponCode: couponCode })

    console.log("start")
    console.log(amount)
    console.log("end")



    let hmac = crypto.createHmac("sha256", key_secret);

    hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
    hmac = hmac.digest("hex");

    if (hmac == payment.razorpay_signature) {

      const userData = await User.findOne({ email: req.session.email });
      const cartData = await Cart.findOne({ userId: userData._id });

      const proData = [];
      for (let i = 0; i < cartData.items.length; i++) {
        proData.push(cartData.items[i]);
      }
      console.log(proData);
      const quantity = [];

      for (let i = 0; i < proData.length; i++) {
        quantity.push(proData[i].quantity);
      }

      const proId = [];

      for (let i = 0; i < proData.length; i++) {
        proId.push(proData[i].productsId);
      }

      for (let i = 0; i < proId.length; i++) {
        // const product = await Product.findByIdAndUpdate(
        //   { _id: proId[i] },
        //   {
        //     $inc: {
        //       stock: -quantity[i],
        //     },
        //   }
        // );
        const proId = proData[i].productId;
        const quantity = proData[i].quantity;
        const selectedSize = proData[i].size.toLowerCase();

        const product = await Product.findById(proId);

        if (product) {
          console.log("Product size:", product.size);
          console.log("Selected size:", selectedSize);

          if (
            product.size &&
            product.size[selectedSize] &&
            product.size[selectedSize].quantity >= quantity
          ) {
            product.size[selectedSize].quantity -= quantity;
            await product.save();
            console.log(`Stock updated for product with ID ${proId}`);
          } else {
            console.error(
              `Invalid size or insufficient stock for product with ID ${proId}`
            );
          }
        } else {
          console.error(`Product with ID ${proId} not found`);
          res.json({ status: "error", message: "Product not found" });
          return;
        }
      }
      // const orderNum = generateOrder.generateOrder();


      if (findCoupon) {

        const addressData = await Address.findOne({ _id: addressId });
        const date = generateDate();
        const orderData = new Order({
          userId: userData._id,
          userEmail: userData.email,
          orderNumber: order_id,
          items: proData,
          totalAmount: amount,
          orderType: "Razorpay",
          orderDate: date,
          status: "Processing",
          shippingAddress: addressData,
          coupon: findCoupon.couponCode,
          discount: findCoupon.discount
        });

        orderData.save();

        const updateCoupon = await Coupon.findByIdAndUpdate({ _id: findCoupon._id },
          {
            $push: {
              users: userData._id
            }
          })
      } else {
        const addressData = await Address.findOne({ _id: addressId });
        const date = generateDate();
        const orderData = new Order({
          userId: userData._id,
          userEmail: userData.email,
          orderNumber: order_id,
          items: proData,
          totalAmount: amount,
          orderType: "Razorpay",
          orderDate: date,
          status: "Processing",
          shippingAddress: addressData,
        });

        orderData.save();
      }

      // const userInWallet = await Wallet.findOne({ userId: userData._id });

      // if (userInWallet) {
      //   const wallet = await Wallet.findOneAndUpdate(
      //     { userId: userData._id },
      //     {
      //       $push: {
      //         transactions: {
      //           date: date,
      //           amount: cartData.total,
      //           orderType: "Razorpay",
      //         },
      //       },
      //     }
      //   );
      // } else {
      //   const wallet = new Wallet({
      //     userId: userData._id,
      //     transactions: [
      //       {
      //         date: date,
      //         amount: cartData.total,
      //         orderType: "Razorpay",
      //       },
      //     ],
      //   });

      //   await wallet.save();
      // }

      res.json({ status: true });

      const deleteCart = await Cart.findByIdAndDelete({ _id: cartData._id });
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadOrder,
  loadOrderDetail,
  saveOrder,
  orderSuccess,
  verifyPayment

}