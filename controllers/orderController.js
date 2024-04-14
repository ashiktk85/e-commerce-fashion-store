const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const wishlist = require("../models/wishlistModel");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const generateDate = require("../controllers/dateGenerator");
const generateTransaction = require("../controllers/transactionId");
const { generateOrder, otpGnerator } = require("./otpGenerator");

//RAZOR PAY FUNCTION

var instance = new Razorpay({
  key_id: "rzp_test_ECB3Zjd1NyXFF9",
  key_secret: "iEgLaQf47PbHbiIodSNL8NvV",
});

// LOAD ADMIN ORDER PAGE

const loadOrder = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const ordersPerPage = 10; 
    const skip = (page - 1) * ordersPerPage;

    const orderData = await Order.find({})
      .skip(skip)
      .limit(ordersPerPage);

    const totalOrders = await Order.countDocuments({});
    const totalPages = Math.ceil(totalOrders / ordersPerPage);

    res.render("adminOrders", { orderData, totalPages, currentPage: page, ordersPerPage });
  } catch (error) {
    console.log(`Error in loading orders: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};




//ADMIN DETAIL ORDER

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

// LOAD USER DETAIL ORDER PAGE

const loadViewOrder = async (req, res) => {
  try {
    const id = req.query.id;
    const findOrder = await Order.findById({ _id: id });
    console.log(findOrder);

    const proId = [];

    for (let i = 0; i < findOrder.items.length; i++) {
      proId.push(findOrder.items[i].productId);
    }

    const proData = [];

    for (let i = 0; i < proId.length; i++) {
      proData.push(await Product.findById({ _id: proId[i] }));
    }

    res.render("orderView", { proData, findOrder });
  } catch (error) {
    console.log(error.message);
  }
};

// USER CANCEL ORDER

const cancelOrder = async (req, res) => {
  try {
    const id = req.body.id;

    const findOrder = await Order.findById(id);
    const userData = await User.findOne({ email: req.session.email });

    if (!findOrder) {
      return res.json({ status: false, message: "Order not found" });
    }

    if (
      findOrder.orderType === "Cash on Delivery" ||
      findOrder.orderType === "Razorpay"
    ) {
      await Order.findByIdAndUpdate(id, { $set: { status: "Canceled" } });

      for (const item of findOrder.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { [`size.${item.size}.quantity`]: item.quantity },
        });
      }

      if (findOrder.orderType === "Razorpay") {
        const userWallet = await Wallet.findOneAndUpdate(
          { userId: userData._id },
          {
            $inc: { balance: findOrder.totalAmount },
            $push: {
              transactions: {
                id: generateTransaction(),
                date: generateDate(),
                amount: findOrder.totalAmount,
              },
            },
          },
          { upsert: true }
        );
      }
    }

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
    res.json({ status: false, message: "Error cancelling order" });
  }
};

// USER RETURN ORDER

const returnRequest = async (req, res) => {
  try {
    const reason = req.body.reasonValue;
    const id = req.body.id;

    const findOrder = await Order.findById(id);
    if (!findOrder) {
      return res.json({ status: false, message: "Order not found" });
    }

    findOrder.status = "Return process";
    findOrder.reason = reason;
    await findOrder.save();

    for (const item of findOrder.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { [`size.${item.size}.quantity`]: item.quantity },
      });
    }

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ status: false, message: "Error processing return request" });
  }
};

// CANCEL RETURN

const cancelReturn = async (req, res) => {
  try {
    const id = req.body.id;

    const findOrder = await Order.findById(id);
    if (!findOrder) {
      return res.json({ status: false, message: "Order not found" });
    }

    findOrder.status = "Delivered";
    await findOrder.save();

    for (const item of findOrder.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { [`size.${item.size}.quantity`]: -item.quantity },
      });
    }

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ status: false, message: "Error cancelling return request" });
  }
};

// SAVING ORDER

const saveOrder = async (req, res) => {
  try {
    console.log("getting here");
    const { status, id } = req.body;

    console.log(id, status);

    const order = await Order.findById(id);
    const prosize = order.items[0].size;
    const size = prosize.toLowerCase();

    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    if (order.status === status) {
      return res.json({ status: "notChanged" });
    }

    await Order.findByIdAndUpdate(id, { $set: { status: status } });

    if (status === "Canceled") {
      if (order.orderType === "COD") {
        const proId = order.items.map((item) => item.productId);

        for (let i = 0; i < proId.length; i++) {
          await Product.findByIdAndUpdate(proId[i], {
            $inc: { size: size.quantity },
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
    res.render("orderSuccess");
  } catch (error) {
    console.log(`error in order success page ${error.message}`);
  }
};

// VERIFYING RAZOR PAYMENT

const verifyPayment = async (req, res) => {
  try {
    console.log("getting to razor verifyyyyy....");
    const { payment, order, selectedSize, order_id, amount, couponCode,selectedAddress } =
      req.body;
    console.log(payment, order,"size :", selectedSize, order_id, amount, couponCode ,"selected add", selectedAddress);
    const findCoupon = await Coupon.findOne({ couponCode: couponCode });

    console.log("start");
    console.log(amount);
    console.log("end");

    let hmac = crypto.createHmac("sha256", "iEgLaQf47PbHbiIodSNL8NvV");

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
        proId.push(proData[i].productId);
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
        const addressData = await Address.findOne({ _id:selectedAddress});
        console.log("order address : ", addressData);
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
          discount: findCoupon.discount,
        });

        orderData.save();

        const updateCoupon = await Coupon.findByIdAndUpdate(
          { _id: findCoupon._id },
          {
            $push: {
              users: userData._id,
            },
          }
        );
      } else {
        const addressData = await Address.findOne({ _id: selectedAddress });
        console.log("addresss . . . . .",addressData);
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

      res.json({ status: true });

      const deleteCart = await Cart.findByIdAndDelete({ _id: cartData._id });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// CHECKOUT PAYMENT FAILED

const failedPayment = async (req, res) => {
  try {
    const { selectedAddress, amount, couponCode } = req.body;
    console.log(selectedAddress, amount, couponCode, "kjsldvhkdjhvhk");

    const userData = await User.findOne({ email: req.session.email });
    const cartData = await Cart.findOne({ userId: userData._id });
    const date = generateDate();
    const orderNum = generateOrder();
    const addressData = await Address.findById({ _id: selectedAddress });

    const proData = [];

    for (let i = 0; i < cartData.items.length; i++) {
      proData.push(cartData.items[i]);
    }

    const orderData = new Order({
      userId: userData._id,
      userEmail: userData.email,
      orderNumber: orderNum,
      items: proData,
      totalAmount: amount,
      orderType: "Razorpay",
      orderDate: date,
      status: "Payment Pending",
      shippingAddress: addressData,
    });

    orderData.save();
    const deleteCart = await Cart.findByIdAndDelete({ _id: cartData._id });

    res.json({ status: "failed" });
  } catch (error) {
    console.log(`error in failed payment post ${error.message}`);
  }
};

// FAILED PAYMENT , PAY AGAIN (ORDER)

const continuePayment = async (req, res) => {
  try {
    console.log("continue payment");
    const id = req.body.id;

    const findOrder = await Order.findById(id);
    if (!findOrder) {
      return res
        .status(404)
        .json({ status: false, message: "Order not found" });
    }

    const proData = findOrder.items;
    const quantity = proData.map((item) => item.quantity);

    const products = [];
    for (let i = 0; i < proData.length; i++) {
      const product = await Product.findById(proData[i].productId);
      if (!product) {
        return res
          .status(404)
          .json({ status: false, message: "Product not found" });
      }
      products.push(product);
    }

    for (let i = 0; i < products.length; i++) {
      const size = proData[i].size;
      if (!size || !products[i].size[size]) {
        return res.status(400).json({ status: false, message: "Invalid size" });
      }
      const currentQuantity = products[i].size[size].quantity;
      const orderedQuantity = quantity[i];
      if (currentQuantity < orderedQuantity) {
        return res
          .status(400)
          .json({
            status: false,
            message: `Not enough stock for product ${products[i].name}`,
          });
      }
      products[i].size[size].quantity -= orderedQuantity;
      await products[i].save();
    }

    const stringOrder_id = findOrder.orderNumber.toString();

    var options = {
      amount: findOrder.totalAmount * 100,
      currency: "INR",
      receipt: stringOrder_id,
    };

    console.log(options);

    instance.orders.create(options, async (error, razorpayOrder) => {
      console.log("inside the order");
      console.log(razorpayOrder);
      if (!error) {
        console.log("without ERROR");
        res.json({
          status: true,
          order: razorpayOrder,
          orderId: findOrder._id,
        });
      } else {
        console.log("full error");
        console.error(error);
        res
          .status(500)
          .json({ status: false, message: "Failed to create order" });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// VERIFY PAYMENT ORDER SIDE

const successPayment = async (req, res) => {
  try {
    const { response, order } = req.body;
    console.log(response, order);

    let hmac = crypto.createHmac("sha256", "iEgLaQf47PbHbiIodSNL8NvV");
    hmac.update(
      response.razorpay_order_id + "|" + response.razorpay_payment_id
    );
    hmac = hmac.digest("hex");

    if (hmac == response.razorpay_signature) {
      const updateOrder = await Order.findByIdAndUpdate(
        { _id: order },
        {
          $set: {
            status: "Processing",
          },
        }
      );

      res.json({ status: true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ORDER INVOICE

const invoice = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const findOrder = await Order.findById({ _id: id });

    const userData = await User.findById({ _id : findOrder.userId })
    console.log(userData);

    const proId = [];

    for (let i = 0; i < findOrder.items.length; i++) {
      proId.push(findOrder.items[i].productId);
    }

    const proData = [];

    for (let i = 0; i < proId.length; i++) {
      proData.push(await Product.findById({ _id: proId[i] }));
    }

    console.log("productssssssssss.s.s.s..s.s.s.s.", proData)
    console.log(findOrder)

    res.render("invoice", { proData, findOrder , userData});
  } catch (error) {
    console.log(`error in invoice ${error.message}`);
  }
};

module.exports = {
  loadOrder,
  loadOrderDetail,
  saveOrder,
  orderSuccess,
  verifyPayment,
  loadViewOrder,
  cancelOrder,
  returnRequest,
  cancelReturn,
  failedPayment,
  continuePayment,
  successPayment,
  invoice,
};
