const Coupon = require("../models/couponModel");
const couponCode = require("../controllers/couponCode");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");

// LOAD CUOPON PAGE

const loadCouponPage = async (req, res) => {
  try {
    const couponData = await Coupon.find({});
    res.render("adminCoupon", { couponData });
  } catch (error) {
    console.log(error.message);
  }
};

// ADDING COUPON PAGE

const addCouponLoad = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (error) {
    console.log(error.message);
  }
};

// POST ADD COUPON

const addCoupon = async (req, res) => {
  try {
    const { Minimum, startDate, nameValue, endDate, maximum, discount } =
      req.body;

    const addCoupon = new Coupon({
      name: nameValue,
      startDate: startDate,
      EndDate: endDate,
      minimumAmount: Minimum,
      maximumAmount: maximum,
      discount: discount,
      couponCode: "KEVINHILLS" + couponCode(6),
    });
    console.log(addCoupon.couponCode);
    await addCoupon.save();

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
  }
};

// LOADING EDIT COUPON PAGE

const editCouponpage = async (req, res) => {
  try {
    const id = req.query.id;
    const findCoupon = await Coupon.findById({ _id: id });
    console.log(id);
    res.render("editCoupon", { findCoupon });
  } catch (error) {
    console.log(error.messagge);
  }
};

// EDIT COUPON (POST)

const editCoupon = async (req, res) => {
  try {
    const { Minimum, startDate, nameValue, endDate, maximum, discount } =
      req.body;
    // console.log(Minimum,startDate,nameValue,endDate,maximum,discount)
    const id = req.body.id;
    //   console.log(id)
    const couponData = await Coupon.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          name: nameValue,
          startDate: startDate,
          EndDate: endDate,
          minimumAmount: Minimum,
          maximumAmount: maximum,
          discount: discount,
        },
      }
    );

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
  }
};

// BLOCK COUPON

const blockCoupon = async (req, res) => {
  try {
    const id = req.body.id;
    const findCoupon = await Coupon.findById({ _id: id });
    console.log(findCoupon);
    console.log("inside block coupon")
    if (findCoupon.isActive === true) {
      const updateCoupon = await Coupon.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            isActive: false,
          },
        }
      );

      res.json({ status: true });
    } else {
      const updateCoupon = await Coupon.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            isActive: true,
          },
        }
      );

      res.json({ status: false });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// APPLY COUPON

const applyCoupon = async (req, res) => {
  try {
    const { code, id } = req.body;
    console.log(code, id);
    const cart = await Cart.findOne({ _id: id });
    console.log(cart)

    const coupon = await Coupon.findOne({ couponCode: code });
    console.log(coupon)

    const user = await User.findOne({ email: req.session.email });
    console.log(user._id)

    if (coupon) {
      if (
        
        cart.totalPrice>=coupon.minimumAmount && coupon.minimumAmount < coupon.maximumAmount
      ) {
        console.log("inside second idf of coupon finding");
        const userInsidecoupon = await Coupon.findOne({
          _id: coupon._id,
          users: user._id,
        });
        console.log(userInsidecoupon);
        if (userInsidecoupon) {
          res.json({ status: "used" });
        } else {
          const amount = (cart.totalPrice / 100) * coupon.discount;
          console.log(amount);
          res.json({
            status: true,
            total: amount,
            cartTotal: cart.totalPrice,
            code: code,
          });
        }
      } else {
        console.log("invaliddddyyyy");
        res.json({ status: "Limit" });
      }
    } else {
      console.log("its main invalidh");
      res.json({ status: "invalid" });
    }
  } catch (error) {
    console.log(`error in  apply coupon post ${error.message}`);
  }
};

module.exports = {
  loadCouponPage,
  addCouponLoad,
  addCoupon,
  editCouponpage,
  editCoupon,
  blockCoupon,
  applyCoupon,
};
