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
    const cart = req.session.cart;
    const wish = req.session.wish;

    const userData = await User.findOne({ email: email });
    const cartData = await Cart.findOne({ userId: userData._id });
    const proData = [];

    if (cartData) {
      const arr = [];

      for (let i = 0; i < cartData.items.length; i++) {
        arr.push(cartData.items[i].productId.toString());
      }

      for (let i = 0; i < arr.length; i++) {
        proData.push(await Product.findById(arr[i]));
      }

      let total = 0; // Initialize total price to 0

      for (let i = 0; i < proData.length; i++) {
        if (proData[i].offerPrice * cartData.items[i].quantity !== cartData.items[i].subTotal) {
          cartData.items[i].subTotal = proData[i].offerPrice * cartData.items[i].quantity;
        }
        
        total += cartData.items[i].subTotal; // Accumulate subtotal to calculate total
      }

      cartData.totalPrice = total; // Update totalPrice field
      await cartData.save(); // Save the updated cart data
    }

    res.render("cart", { proData, cartData, cart, wish });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




// ADD TO CART post loading
const loadCart = async (req, res) => {
  try {
    console.log("Getting to load cart...");

    let { id, proPrice, selectedSize } = req.body;
    selectedSize = selectedSize.toLowerCase().trim();
    const price = parseInt(proPrice);

    if (req.session.email) {
      const userData = await User.findOne({ email: req.session.email });
      const userCart = await Cart.findOne({ userId: userData._id });
      const proData = await Product.findById(id);

      if (proData && !proData.is_blocked) {
        const availableQuantity = proData.size[selectedSize].quantity;

        if (availableQuantity <= 0) {
          return res.status(200).json({ status: "Out of stock" });
        }

        let subtotal = price * 1; // Assuming quantity is always 1

        if (userCart) {
          let proCart = false;

          for (let i = 0; i < userCart.items.length; i++) {
            if (id == userCart.items[i].productId && selectedSize == userCart.items[i].size) {
              proCart = true;
              break;
            }
          }

          if (proCart) {
            return res.status(200).json({ status: "alreadyInCart" });
          } else {
            const cartItem = {
              productId: id,
              subTotal: subtotal,
              quantity: 1,
              size: selectedSize,
            };
            
            // Update or add the cart item
            await Cart.findOneAndUpdate(
              { userId: userData._id },
              {
                $push: { items: cartItem },
                $inc: { totalPrice: subtotal },
              },
              { upsert: true } // Create new cart if not exists
            );
          }
        } else {
          const cartData = new Cart({
            userId: userData._id,
            items: [
              {
                productId: id,
                subTotal: subtotal,
                quantity: 1,
                size: selectedSize,
              },
            ],
            totalPrice: subtotal,
          });
          await cartData.save();
        }

        res.json({ status: true });
      } else {
        res.status(401).json({ status: "Product not available" });
      }
    }
  } catch (error) {
    console.log(`Error in adding cart data: ${error}`);

    res.status(500).json({ error: "Internal Server Error" });
  }
};








const increment = async (req, res) => {
  try {
    const { offerprice, proId, qty, subtotal, sizeS } = req.body;
    console.log(offerprice, proId, qty, subtotal, sizeS);
    const proIdString = proId.toString();
    const sizee = String(sizeS).trim();
    console.log(sizee);
    console.log('the proid is', proIdString);
    const quantity = parseInt(qty);
    const findCart = await Cart.findOne({ userId: req.session.userId });

    let response;

    if (quantity > 9) {
      response = { status: "maximum" };
    } else {
    
      const product = await Product.findOne({ _id: proIdString });
      console.log(product);

      const cart = await Cart.findOne({ userId: req.session.userId });
      console.log(cart);

      if (cart) {
        const stock = cart.items.find(val => val.productId.equals(proIdString) && val.size == sizee);
        console.log(stock, "stocksss..........");

        const productStock = product ? product.size[sizee] : 0;
        const proQuantity = parseInt(stock.quantity);
        const availableQuantity = parseInt(productStock.quantity);

        if (availableQuantity > proQuantity) {
          const addPrice = await Cart.findOneAndUpdate(
            { userId: req.session.userId, "items.productId": proIdString },
            {
              $inc: {
                "items.$.price": offerprice,
                "items.$.quantity": 1,
                "items.$.subTotal": offerprice,
                totalPrice: offerprice,
              },
            }
          );
          response = { status: true, total: findCart.totalPrice };
        } else {
          response = { status: "lowStock" };
        }
      }
    }

    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.json({ status: false, error: error.message });
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

    const findCoupon = await Coupon.findOne({ couponCode: code });

    if (!selectedAddress || !paymentMethod) {
      res.json({ status: "fill" });
      return;
    } else if (paymentMethod == "Cash on Delivery") {
      const userData = await User.findOne({ email: req.session.email });
      const cartData = await Cart.findOne({ userId: userData._id });

      const proData = cartData.items;

      for (let i = 0; i < proData.length; i++) {
        const proId = proData[i].productId;
        const quantity = proData[i].quantity;
        const selectedSize = proData[i].size.toLowerCase();

        const product = await Product.findById(proId);
        const offerPrice = product.offerPrice || product.regularPrice;

        const subtotal = offerPrice * quantity;
        proData[i].subTotal = subtotal;
      }

      const newTotal = proData.reduce((acc, item) => acc + item.subTotal, 0);

      const orderNum = generateOrder.generateOrder();
      console.log(orderNum);

      const addressData = await Address.findOne({ _id: selectedAddress });
      console.log(addressData);

      const date = generateDate();

      if (findCoupon) {
        console.log("inside find coupon");
        const orderData = new Order({
          userId: userData._id,
          userEmail: userData.email,
          orderNumber: orderNum,
          items: proData,
          totalAmount: newTotal - findCoupon.discount,
          orderType: paymentMethod,
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
        const orderData = new Order({
          userId: userData._id,
          userEmail: userData.email,
          orderNumber: orderNum,
          items: proData,
          totalAmount: newTotal,
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
    const email = req.session.email;

    const user = await User.findOne({ email: email });
    const cart = await Cart.findOne({ userId: user._id });

    
    const removedItem = cart.items.find(item => item.productId.toString() === id && item.size.trim() === size);

    if (!removedItem) {
   
      return res.status(404).send("Item not found in cart.");
    }

    const deleteOne = await Cart.findOneAndUpdate(
      { userId: user._id },
      {
        $pull: {
          items: { productId: removedItem.productId, size: size },
        },
        $inc: {
          totalPrice: -removedItem.subTotal 
        }
      },
      { new: true } 
    );

    res.redirect("/cart");
  } catch (error) {
    console.log(`Error in removing single cart item: ${error}`);
    res.status(500).send("Internal Server Error");
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
};
