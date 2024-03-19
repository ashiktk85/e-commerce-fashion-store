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
      couponCode: "Echo" + couponCode(6),
    });
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

const blockCoupon=async(req,res)=>{
    try {
        const id=req.body.id
        const findCoupon = await Coupon.findById({_id:id})
        // console.log("inside block coupon")
        if(findCoupon.isActive===true){
            const updateCoupon = await Coupon.findByIdAndUpdate({_id:id},
                {
                    $set:{
                        isActive:false
                    }
                })

                res.json({status:true})
                
        }else{
            const updateCoupon=await Coupon.findByIdAndUpdate({_id:id},
                {
                    $set:{
                        isActive:true
                    }
                })  

                res.json({status:false})
        }


    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
  loadCouponPage,
  addCouponLoad,
  addCoupon,
  editCouponpage,
  editCoupon,
  blockCoupon
};
