const User = require("../models/userModel");
const otpGnerator = require("./otpGenerator");
const otp = require("./otpGenerator");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const generateOrder = require("../controllers/otpGenerator");
const generateDate = require("../controllers/dateGenerator");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Razorpay = require("razorpay");

//RAZOR PAY FUNCTION

var instance = new Razorpay({
  key_id: "rzp_test_ECB3Zjd1NyXFF9",
  key_secret: "iEgLaQf47PbHbiIodSNL8NvV",
});

// LOADING CART PAGE

const cartPage = async (req, res) => {
  try {
    const email = req.session.email;
    // const userData = req.
    const userData = await User.findOne({ email: email });

    const cartData = await Cart.findOne({ userId: userData._id });
    const proData = [];

    if (cartData) {
      const arr = [];

      for (let i = 0; i < cartData.items.length; i++) {
        arr.push(cartData.items[i].productId.toString());
      }
      // console.log(arr);

      for (let i = 0; i < arr.length; i++) {
        proData.push(await Product.findById({ _id: arr[i] }));
      }

      // console.log(proData);
    }

    //   console.log(proData,cartData)
    res.render("cart", { proData, cartData });

    // console.log(cartData)
  } catch (error) {
    console.log(error.message);
  }
};

// ADD TO CART post loading
const loadCart = async (req, res) => {
  try {
    console.log("getting to load carttttttttttttttttttttttttttttt");
    let { id, proPrice, selectedSize } = req.body;
    selectedSize = selectedSize.toLowerCase();
    const price = parseInt(proPrice);

    if (req.session.email) {
      const userData = await User.findOne({ email: req.session.email });
      const userCart = await Cart.findOne({ userId: userData._id });
      const proData = await Product.findById({ _id: id });

      if (proData) {
        if (proData.size[selectedSize].quantity <= 0) {
          return res
            .status(200)
            .json({ success: false, message: "out of stock" });
        }

        if (userCart) {
          let proCart = false;
          console.log("usercart");
          for (let i = 0; i < userCart.items.length; i++) {
            console.log(
              "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh"
            );
            if (
              id == userCart.items[i].productId &&
              selectedSize == userCart.items[i].size
            ) {
              console.log("product in userCart");
              proCart = true;
              break;
            }
          }
          if (proCart) {
            console.log("jjjjjjjjsii");
            res.json({ status: "viewCart" });
          } else {
            console.log("view cart else");
            await Cart.findOneAndUpdate(
              { userId: userData._id },
              {
                $push: {
                  items: {
                    productId: id,
                    subTotal: proPrice,
                    quantity: 1,
                    size: selectedSize,
                  },
                },
                $inc: {
                  totalPrice: proPrice,
                },
              }
            );
          }
        } else {
          console.log("big if else");
          const cartData = new Cart({
            userId: userData._id,
            items: [
              {
                productId: id,
                subTotal: proPrice,
                quantity: 1,
                size: selectedSize,
              },
            ],
            totalPrice: proPrice,
          });
          await cartData.save();
        }

        res.json({ status: true });
      } else {
        res.json({ status: "login" });
      }
    }
  } catch (error) {
    console.log(`Error in adding cart data: ${error}`);

    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const increment = async (req, res) => {
//   try {
//     console.log("carrttttyyyyyyyyy");
//     const { offerprice, proId, qty, size } = req.body;

//     const quantity = parseInt(qty);
//     const proIdString = proId.toString();

//     const proData = await Product.findById(proId);
//     const sizeLower = size.toLowerCase();

//     // Check if the specified size exists in the product's size object
//     if (proData.size && proData.size[sizeLower]) {
//       const stock = proData.size[sizeLower].quantity;

//       if (stock >= quantity) {
//         if (quantity < 10) {
//           // Update cart
//           const addPrice = await Cart.findOneAndUpdate(
//             { userId: req.session.userId, "items.productId": proIdString },
//             {
//               $inc: {
//                 "items.$.price": offerprice,
//                 "items.$.quantity": 1,
//                 "items.$.subTotal": offerprice,
//                 totalPrice: offerprice,
//               },
//             }
//           );

//           // Decrease the stock of the product
//           const updatedStock = stock - quantity;
//           await Product.findByIdAndUpdate(
//             proId,
//             { $set: { [`size.${sizeLower}.quantity`]: updatedStock } },
//             { new: true }
//           );

//           // Place order if the cart total is updated successfully
//           const cartData = await Cart.findOne({ userId: req.session.userId });
//           const total = cartData.totalPrice;
//           const code = ""; // Set coupon code if applicable

//           await placeOrder({
//             selectedAddress: "address_id_here",
//             paymentMethod: "payment_method_here",
//             cartid: cartData._id,
//             total,
//             code,
//           });

//           res.json({ status: true, total });
//         } else {
//           res.json({ status: "minimum" });
//         }
//       } else {
//         res.json({ status: "stock" });
//       }
//     } else {
//       res.json({ status: "invalid size" });
//     }
//   } catch (error) {
//     console.log(`Error in addCart: ${error}`);
//     res.json({ status: "error" });
//   }
// };

const increment = async (req, res) => {
  try {
    console.log("getting to increment ...");
    const email = req.session.email;
    const user = await User.findOne({ email: email });
    let { proId, size, qty, price } = req.body;
    const siz = size;
    console.log(proId, siz, qty, price);

    const amount = parseInt(price);

    const cart = await Cart.findOne({ userId: user });

    console.log(cart);

    if (cart) {
      let filter = [];
      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        console.log(
          `Comparing item ${i}: productId=${item.productId}, size=${item.size}`
        );
        console.log(`Target values: proId=${proId}, siz=${siz}`);
        if (item.productId == proId && item.size == siz.toString()) {
          filter.push(item);
        }
      }
      console.log("Filtered items: ", filter);
    }
  } catch (error) {
    console.log(`error in  increment cart : ${error.message}`);
  }
};

const selectS = async (req, res) => {
  try {
    const datafrom = req.body.s;
    const id = req.body.pdtID;
    console.log("the id is ", id);
    const product = await Product.findOne({ _id: id });
    const stock = product.size.s.quantity;
    console.log("the stock is ", stock);
    if (datafrom) {
      res.status(200).json({ size: "s", stock: stock });
    }
  } catch (error) {
    console.log(error);
  }
};

const selectM = async (req, res) => {
  try {
    const datafrom = req.body.m;
    console.log(" the data form is ", datafrom);
    const id = req.body.pdtID;
    console.log("the id is ", id);
    const product = await Product.findOne({ _id: id });
    const stock = product.size.m.quantity;
    console.log("the stock is ", stock);
    console.log(product);
    if (datafrom) {
      // const quantity = product.size.m
      // console.log(quantity);
      res.status(200).json({ size: "m", stock: stock });
    }
  } catch (error) {
    console.log(error);
  }
};

const selectL = async (req, res) => {
  try {
    const datafrom = req.body.l;
    const id = req.body.pdtID;
    console.log("the id is ", id);
    const product = await Product.findOne({ _id: id });
    const stock = product.size.l.quantity;
    console.log("the stock is ", stock);
    if (datafrom) {
      res.status(200).json({ size: "l", stock: stock });
    }
  } catch (error) {
    console.log(error);
  }
};

const decrement = async (req, res) => {
  try {
    const { offerprice, proId, qty, subtotal, sizeS } = req.body;
    console.log(offerprice, proId, qty, subtotal, sizeS);
    const proIdString = proId.toString();
    const quantity = parseInt(qty);

    if (quantity > 1) {
      const addPrice = await Cart.findOneAndUpdate(
        { userId: req.session.userId, "items.productId": proIdString },
        {
          $inc: {
            "items.$.price": -offerprice,
            "items.$.quantity": -1,
            "items.$.subTotal": -offerprice,
            totalPrice: -offerprice,
          },
        }
      );

      const findCart = await Cart.findOne({ userId: req.session.userId });

      res.json({ status: true, total: findCart.totalPrice });
    } else {
      res.json({ status: "minimum" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// LOADING CHEKOUT PAGE

const checkout = async (req, res) => {
  try {
    const userId = req.session.userId;
    const email = req.session.email;
    const userData = await User.findOne({ email: email });

    const cartData = await Cart.findOne({ userId: userData._id });

    const userAddress = await Address.find({ userId });
    const quantity = [];

    for (let i = 0; i < cartData.items.length; i++) {
      quantity.push(cartData.items[i].quantity);
    }

    const proId = [];
    for (let i = 0; i < cartData.items.length; i++) {
      proId.push(cartData.items[i].productId);
    }
    const proData = [];

    for (let i = 0; i < proId.length; i++) {
      proData.push(await Product.findById({ _id: proId[i] }));
    }

    res.render("checkout", { userAddress, cartData, proData });
  } catch (error) {
    console.log(`error in loading checkout page : ${error}`);
  }
};

// PLACING AND SAVING THE ORDER

const placeOrder = async (req, res) => {
  try {
    const { selectedAddress, paymentMethod, cartid, total, code } = req.body;
    console.log(selectedAddress, paymentMethod, cartid);
    console.log(selectedAddress, paymentMethod, cartid);

    const findCoupon = await Coupon.findOne({ couponCode: code });

    if (!selectedAddress || !paymentMethod) {
      res.json({ status: "fill" });
      return;
    } else if (paymentMethod == "Cash on Delivery") {
      const userData = await User.findOne({ email: req.session.email });
      const cartData = await Cart.findOne({ userId: userData._id });

      const proData = cartData.items;
      console.log(proData);

      for (let i = 0; i < proData.length; i++) {
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
            res.json({
              status: "error",
              message: "Invalid size or insufficient stock",
            });
            return;
          }
        } else {
          console.error(`Product with ID ${proId} not found`);
          res.json({ status: "error", message: "Product not found" });
          return;
        }
      }

      const orderNum = generateOrder.generateOrder();
      console.log(orderNum);

      const addressData = await Address.findOne({ _id: selectedAddress });
      console.log(addressData);

      const date = generateDate();

      if (findCoupon) {
        console.log("insise find coupon");
        const orderData = new Order({
          userId: userData._id,
          userEmail: userData.email,
          orderNumber: orderNum,
          items: proData,
          totalAmount: total,
          orderType: paymentMethod,
          orderDate: date,
          status: "Processing",
          shippingAddress: addressData,
          coupon:findCoupon.couponCode,
          discount: findCoupon.discount,
        });

        orderData.save();

        const updateCouppon = await Coupon.findByIdAndUpdate(
          { _id: findCoupon._id },
          {
            $push: {
              users: userData._id,
            },
          }
        );
      } else {
        const orderData = new Order({
          userId: userData._id,
          userEmail: userData.email,
          orderNumber: orderNum,
          items: proData,
          totalAmount: total,
          orderType: paymentMethod,
          orderDate: date,
          status: "Processing",
          shippingAddress: addressData,
        });

        orderData.save();
      }

      res.json({ status: true });
      const deleteCart = await Cart.findByIdAndDelete({ _id: cartData._id });
    } else if (paymentMethod == "Razorpay") {
      const userData = await User.findOne({ email: req.session.email });
      const cartData = await Cart.findOne({ userId: userData._id });

      const proData = [];
      for (let i = 0; i < cartData.items.length; i++) {
        proData.push(cartData.items[i]);
      }

      const quantity = [];

      for (let i = 0; i < proData.length; i++) {
        quantity.push(proData[i].quantity);
      }

      const proId = [];

      for (let i = 0; i < proData.length; i++) {
        proId.push(proData[i].productId);
      }

      const orderNum = generateOrder.generateOrder();
      const stringOrderId = orderNum.toString();
      const addressData = await Address.findOne({ _id: selectedAddress });
      const date = generateDate();

      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: stringOrderId,
      };

      console.log(`options : ${options.amount}`);

      let amount = Number(total);
      console.log(amount, "amountyyy");

      instance.orders.create(options, async (error, razorpayOrder) => {
        if (!error) {
          console.log("getting to razyyy");
          console.log(`razorpay order  : ${razorpayOrder}`);
          console.log("Order ID:", razorpayOrder.id);
          console.log("Amount:", razorpayOrder.amount);

            res.json({
            status: "razorpay",
            order: razorpayOrder,
            address: selectedAddress,
            orderNumber: orderNum,
            total: amount,
            code: code,
          });
        } else {
          console.log(error.message);
        }
      });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ status: "error", message: error.message });
  }
};

// REMOVING SINGLE CART ITEM

const removeItemCart = async (req, res) => {
  try {
    const id = req.query.id;
    const size = req.query.size;
    console.log(id, size);
    const email = req.session.email;

    const user = await User.findOne({ email: email });
    const data = await Cart.findOne({ userId: user._id });

    console.log(data);

    const deleteOne = await Cart.findOneAndUpdate(
      { userId: user._id },
      {
        $pull: {
          items: { productId: id, size: size },
        },
      }
    );

    res.redirect("/cart");
  } catch (error) {
    console.log(`error in removing single cart item : ${error}`);
  }
};

const clearCart = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);

    const deleteCart = await Cart.findByIdAndDelete({ _id: id });
    res.redirect("/cart");
  } catch (error) {
    console.log(`error in clearing cart : ${error}`);
  }
};

module.exports = {
  checkout,
  loadCart,
  cartPage,
  increment,
  decrement,
  placeOrder,
  removeItemCart,
  clearCart,
  selectL,
  selectM,
  selectS,
};
