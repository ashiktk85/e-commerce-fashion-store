const User = require("../models/userModel");
const otpGnerator = require("./otpGenerator");
const otp = require("./otpGenerator");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Orders = require("../models/orderModel");
const Wishlist = require("../models/wishlistModel");
const Coupon = require('../models/couponModel')

// NODEMAILER

const Email = process.env.EMAIL;
const pass = process.env.PASS;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: Email,
    pass: pass,
  },
});

// PASSWORD HASHING

const passwordHashing = async (password) => {
  try {
    const securePass = await bcrypt.hash(password, 10);
    return securePass;
  } catch (error) {
    console.log(`error in hashing password ${error}`);
  }
};

// HOME PAGE

const home = async (req, res) => {
  try {
    const catData = await Category.find({});

    const proData = await Product.find({});

    const cartData = await Cart.find({});

    const isAuthenticated = req.session.email;

    res.render("home", { catData, proData, isAuthenticated, cartData });
  } catch (error) {
    console.log(error);
  }
};

// CREATE ACCOUNT

const userSignupPost = async (req, res) => {
  try {
    let { email, password, name, number, confirm } = req.body;

    name = name.trim();
    email = email.trim();
    password = password.trim();
    number = number.trim();
    confirm = confirm.trim();

    const { otp, otpTime } = otpGnerator.otpGnerator();
    console.log(otp);

    if (
      name === "" ||
      email === "" ||
      password === "" ||
      number === "" ||
      confirm === ""
    ) {
      res.render("register", { message: "Feilds should not be empty." });
    } else if (password !== confirm) {
      res.render("register", { message: "Passwords do not match." });
    } else if (!/^\d{10}$/.test(number)) {
      res.render("register", { message: "Number is invalid." });
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
    ) {
      res.render("register", { message: "Email is invalid." });
    } else if (!/^[A-Z][a-z\s]*([A-Z][a-z\s]*)?$/.test(name)) {
      res.render("register", { message: "Name is invalid." });
    } else if (password.length < 8) {
      res.render("register", {
        message: "Password should contain minimum 8 characters.",
      });
    } else {
   
      const existsEmail = await User.findOne({ email }).catch((err) =>
        console.log(`Error finding email: ${err}`)
      );
      const existMobile = await User.findOne({ mobile: number }).catch((err) =>
        console.log(`Error finding mobile: ${err}`)
      );
      console.log("exist email", existsEmail);

      if (existsEmail) {
        res.render("register", { message: "Email already in use." });
      } else if (existMobile) {
        res.render("register", { message: "Mobile already in use." });
      } else {
        console.log(" working just fine...");

        const newUser = {
          name,
          email,
          number,
          password,
          confirm,
          otp,
          otpTime,
        };

        req.session.Data = req.session.Data || {};

      
        Object.assign(req.session.Data, newUser);
        req.session.save();

        
        const mailOptions = {
          from: Email,
          to: req.body.email,
          subject: "Your OTP Verification",
          text: `Your OTP: ${otp}`,
        };

        transporter.sendMail(mailOptions, (err) => {
          if (err) {
            console.log(err.message);
          } else {
            console.log("Mail sent successfully");
          }
        });

        console.log("User added successfully");
        res.redirect("otpVerification");
      }
    }
  } catch (error) {
    console.log(error.message);
    res.json({
      status: "Failed",
      message: "An unexpected error occurred during user registration.",
    });
  }
};

// OTP VERIFICATION PAGE

const loadOtp = async (req, res) => {
  try {
    res.render("otpVerification");
  } catch (error) {
    console.log(error);
  }
};

// POST OTP DATA

const resendOtp = async (req, res) => {
  try {
    console.log("hello");

    const email = req.session.Data.email;
    const resendOtpGen = otpGnerator.otpGnerator();
    req.session.Data.otp = resendOtpGen;
    console.log(resendOtpGen);

    const mailOptions = {
      form: Email,
      to: email,
      subject: "Your OTP for Verification",
      text: `your otp ${resendOtpGen}`,
    };
    if (mailOptions) {
      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.log(err.message);
        } else {
          console.log("mail send sucessfull");
        }
      });
    }

    res.render("otpVerification", { resendmsg: "OTP was send again" });
  } catch (error) {
    console.log(error.message);
  }
};

// VERIFY OTP

const verifyOtp = async (req, res) => {
  try {
    const getOtp = req.body.otp;
    console.log(getOtp);

    if (req.session.Data) {
      const storedOtpData = req.session.Data.otp;
      const otpTime = req.session.Data.otpTime;

      const currentTime = Date.now();
      const otpExpiryDuration = 60000; 

      
      if (getOtp === storedOtpData) {
        
        if (currentTime - otpTime < otpExpiryDuration) {
          const securePass = await passwordHashing(req.session.Data.password);

         
          const user = new User({
            name: req.session.Data.name,
            email: req.session.Data.email,
            mobile: req.session.Data.number,
            password: securePass,
          });

          const userData = await user.save();
          console.log(userData);

          delete req.session.otpData;

          return res.render("login", {
            success: "OTP verified. You can now log in.",
          });
        } else {
          return res.render("otpVerification", {
            message: "OTP expired, please resend OTP.",
          });
        }
      } else {
        return res.render("otpVerification", {
          message: "Wrong OTP, please try again.",
        });
      }
    } else {
      return res.render("otpVerification", {
        message: "OTP expired, please resend OTP.",
      });
    }
  } catch (error) {
    console.error(`Error in OTP verification: ${error}`);
    return res.render("otpVerification", {
      message: "An error occurred. Please try again later.",
    });
  }
};

// USER LOGIN

const userLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: "An unexpected error occurred during login.",
    });
  }
};

// VERIFY LOGIN

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_blocked == false) {
        req.session.email = email;

        console.log("verify");
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (passwordMatch) {
          req.session.auth = true;
          req.session.userId = userData._id;
          res.redirect("/");
        } else {
          res.render("login", {
            passErr: "Incorrect password. Please try again.",
          });
        }
      } else {
        console.log("user is blocked");
        res.render("login", { blocked: "Currently you are restricted." });
      }
    } else {
      res.render("login", { emailErr: "Incorrect email. Please try again." });
    }
  } catch (error) {
    console.error(`Error in verifying login: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

// LOAD USER REGISTER / SIGN UP

const userSignup = async (req, res) => {
  try {
    res.render("register");
  } catch {
    console.log(error);
  }
};

// FORGOT PASSWORD

const forgotPassword = async (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    console.log(
      `There was an error in rendering forgotpassword page : ${error}`
    );
  }
};

// POST FORGOT PASSWORD

const PostForgotpass = async (req, res) => {
  try {
    const email = req.body.email;
    const newpassword = req.body.forgotPassword;
    const confirmPassword = req.body.confirmPassword;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render("forgotPassword", { message: "Invalid email format." });
    }

    if (newpassword.length < 8) {
      return res.render("forgotPassword", {
        message: "Password must be at least 8 characters long.",
      });
    }

    if (newpassword !== confirmPassword) {
      return res.render("forgotPassword", {
        message: "Passwords do not match.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("forgotPassword", { message: "User not found." });
    }

    const hashedPassword = await passwordHashing(newpassword);
    user.password = hashedPassword;

    await user.save();

    if (req.session.Data) {
      req.session.Data.password = hashedPassword;
      req.session.save();
    }

    return res.render("forgotPassword", {
      success: "Password has been updated.",
    });
  } catch (error) {
    console.log(`There was an error in post forgot password : ${error}`);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

// PRODUCT DETAILS

const productDetails = async (req, res) => {
  try {
    console.log("getting to product details postttttttt");

    const userData = await User.findOne({ email: req.session.email });
    const id = req.query.id;

    const viewCart = await Cart.find();

    const user = await User.findById({ _id: id });
    if (user && user.is_blocked) {
      res.redirect("/login");
      return;
    }

    const cartData = await Cart.findOne({
      userId: userData._id,
      "items.productsId": id,
    });

    const proData = await Product.findById({ _id: id });

    const fullData = await Product.find({});
    const category = await Category.findById(proData.category);

    res.render("productDetails", {
      proData,
      fullData,
      categoryName: category.name,
      cartData,
      viewCart,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



//DASHBOARD

const accountDetails = async (req, res) => {
  try {
    const id = req.session.userId;

    console.log("accound details page");
    const userData = await User.findById({ _id: id });
    console.log(userData);
    res.render("accountDetails", { userData });
  } catch (error) {
    console.log(`error in rendring account details page ${error}`);
  }
};

// VIEW ADDRESS PAGE

const userAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log(userId);
    const email = req.session.email;
    console.log(email);
    const userAddress = await Address.find({ userId });

    res.render("userAddress", { userAddress });
  } catch (error) {
    console.log(`error in rendring user address page : ${error}`);
  }
};

// ADD ADDRESS PAGE

const addAddress = async (req, res) => {
  try {
    res.render("addAddress");
  } catch (error) {
    console.log(`error in rendring add address page ${error}`);
  }
};

// VIEW ORDERS PAGE

const orders = async (req, res) => {
  try {
    const userData = await User.findOne({ email: req.session.email });

    const orderData = await Orders.find({ userId: userData._id }).sort({
      _id: -1,
    });

    res.render("order", { orderData });
  } catch (error) {
    console.log(`error in rendring orders page ${error}`);
  }
};

// Address POST DATA

const postAddress = async (req, res) => {
  try {
    const { name, number, pincode, locality, address, city, state, country } =
      req.body;
    const userId = req.session.userId;

    const existingAddressesCount = await Address.countDocuments({ userId });

    if (existingAddressesCount >= 3) {
      return res.redirect("/userAddress?limitReached=true");
    }

    const userAddress = new Address({
      userId,
      name,
      mobile: number,
      pincode,
      locality,
      address,
      city,
      state,
      country,
    });

    await userAddress.save();

    res.redirect("/userAddress");
  } catch (error) {
    console.log(`error in getting address data post: ${error}`);
  }
};

const deleteAddress = async (req, res) => {
  try {
    console.log("itsugcvkgcfkgdfdjsdr");
    const id = req.query.id;

    const dele = await Address.findByIdAndDelete({ _id: id });
    console.log(id);
    res.redirect("/userAddress");
  } catch (error) {
    console.log(`error in post delete address : ${error}`);
  }
};

const editAddress = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const userAddress = await Address.findById({ _id: id });
    console.log(`itds lsdnlsndojsjdnffojsdn`, userAddress);

    req.session.Address = userAddress;

    res.render("editAddress", { userAddress });
  } catch (error) {
    console.log(`error in geting edit address : ${error}`);
  }
};

// POST EDIT ADDRESS

const postEditaddress = async (req, res) => {
  try {
    console.log("postyy address");

    const { name, number, pincode, locality, address, city, state, country } =
      req.body;
    const userAddress = req.session.Address;

    if (
      name === userAddress.name &&
      number === userAddress.number &&
      pincode === userAddress.pincode &&
      locality === userAddress.locality &&
      address === userAddress.address &&
      city === userAddress.city &&
      state === userAddress.state &&
      country === userAddress.country
    ) {
      const sameNme = "No changes made, Make changes to update.";
      res.render("editAddress", { sameNme, userAddress });
    } else {
      const updatedAddress = await Address.findOneAndUpdate(
        { _id: userAddress._id },
        {
          $set: {
            name,
            mobile: number,
            pincode,
            locality,
            address,
            city,
            state,
            country,
          },
        },
        { new: true }
      );

      res.redirect("/userAddress");
    }
  } catch (error) {
    console.log(`error in post edit address : ${error}`);

    res.redirect(
      "/userAddress?message=Error updating address. Please try again."
    );
  }
};

//  CHANGE PASSWORD

const changePassword = async (req, res) => {
  try {
    res.render("changePassword");
  } catch (error) {
    console.log(`error in rnder change password : ${error}`);
  }
};

//POST CHANGE PASS

const changePass = async (req, res) => {
  try {
    console.log("getting here");
    const { currentPass, newpass, conPass } = req.body;
    console.log(currentPass, newpass, conPass);
    if (newpass == conPass) {
      const email = req.session.email;

      const userData = await User.findOne({ email: email });

      const passwordMatch = await bcrypt.compare(
        currentPass,
        userData.password
      );

      if (passwordMatch) {
        const passwordHash = await passwordHashing(newpass);

        const updatePass = await User.findByIdAndUpdate(
          { _id: userData._id },
          {
            $set: {
              password: passwordHash,
            },
          }
        );

        if (updatePass) {
          res.json({ status: true });
        }
      } else {
        res.json({ status: "wrong" });
      }
    } else {
      res.json({ status: "compare" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//            VIEW ACCOUNT

const viewAccount = async (req, res) => {
  try {
    const email = req.session.email;
    const userData = await User.findOne({ email: email });
    res.render("viewAccount", { userData });
  } catch (error) {
    console.log(`error in view account : ${error}`);
  }
};

// POST EDIT ACCOUNT

const editAccount = async (req, res) => {
  try {
    const email = req.session.email;
    const userData = await User.findOne({ email: email });
    res.render("editAccount", { userData });
  } catch (error) {
    console.log(`error in rendering edit account : ${error}`);
  }
};

const postEditAccount = async (req, res) => {
  try {
    console.log("4rrrrrrrrrrrrrrrrrrr");
    const email = req.session.email;
    const userData = await User.findOne({ email: email });
    console.log(userData);

    const { name, phone } = req.body;

    const Data = await User.findOneAndUpdate(
      { email: email },
      {
        $set: {
          name: name,
          mobile: phone,
        },
      }
    );
    console.log(Data);
    res.redirect("/viewAccount");
  } catch (error) {
    console.error(`Error in getting post data from edit account: ${error}`);

    res.status(500).send("Internal Server Error");
  }
};

//   PRODUCTS PAGE ALL

const allProducts = async (req, res) => {
  try {
    const sort = req.query.sort;

    if (sort == "lowToHigh") {
      const proData = await Product.find({}).sort({ offerPrice: 1 }).limit(6);
      const catData = await Category.find({});
      const newPro = await Product.find({}).sort({ _id: -1 }).limit(3);

      res.render("allProducts", { proData, catData, newPro });
    } else if (sort == "highToLow") {
      const proData = await Product.find({}).sort({ offerPrice: -1 }).limit(6);
      const catData = await Category.find({});
      const newPro = await Product.find({}).sort({ _id: -1 }).limit(3);

      res.render("allProducts", { proData, catData, newPro });
    } else if (sort == "aA-zZ") {
      const proData = await Product.find({}).sort({ name: 1 }).limit(6);
      const catData = await Category.find({});
      const newPro = await Product.find({}).sort({ _id: -1 }).limit(3);

      res.render("allProducts", { proData, catData, newPro });
    } else if (sort == "zZ-aA") {
      const proData = await Product.find({}).sort({ name: -1 }).limit(6);
      const catData = await Category.find({});
      const newPro = await Product.find({}).sort({ _id: -1 }).limit(3);

      res.render("allProducts", { proData, catData, newPro });
    }

    const proData = await Product.find({}).limit(6);
    const catData = await Category.find({});
    const newPro = await Product.find({}).sort({ _id: -1 }).limit(3);

    res.render("allProducts", { proData, catData, newPro });
  } catch (error) {
    console.log(`error in logging all products page : ${error}`);
  }
};


// WISHLIST

const whishlist = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const wishData = await Wishlist.findOne({ user_id: user._id });

   
    if (!wishData || wishData.products.length === 0) {
    
      return res.render("wishlist", { wishData, proData: [] });
    }

    let proId = [];

    for (let i = 0; i < wishData.products.length; i++) {
      proId.push(wishData.products[i].productId);
    }

    let proData = [];

    for (let i = 0; i < proId.length; i++) {
      proData.push(await Product.findById({ _id: proId[i] }));
    }

    console.log(proData);
    res.render("wishlist", { wishData, proData });
  } catch (error) {
    console.log(`error in loading wishlist page ${error}`);
    res.render("error", { error });
  }
};


// ADD WISHLIST

const addWishlist = async (req, res) => {
  try {
    const id = req.body.id;
    console.log(id);

    const user = await User.findOne({ email: req.session.email });

    const proData = await Product.findById({ _id: id });

    if (user) {
      const userFind = await Wishlist.findOne({ user_id: user._id });

      if (userFind) {
        const existingProductIndex = userFind.products.findIndex((product) =>
          product.productId.equals(proData._id)
        );

        if (existingProductIndex !== -1) {
          return res.json({ status: "already" });
        } else {
          await Wishlist.findOneAndUpdate(
            { user_id: user._id },
            {
              $push: {
                products: {
                  productId: proData._id,
                },
              },
            }
          );
        }
      } else {
        const wishlist = new Wishlist({
          user_id: user._id,
          products: [
            {
              productId: proData._id,
            },
          ],
        });
        await wishlist.save();
      }
      return res.json({ status: true });
    } else {
      return res.json("login");
    }
  } catch (error) {
    console.log(`error in add wishlist : ${error}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// REMOVE WISHLIST

const removeWishlist = async (req, res) => {
  try {
    const id = req.body.id;
    const findUser = await User.findOne({ email: req.session.email });

    const dalePro = await Wishlist.findOneAndUpdate(
      { user_id: findUser._id },
      {
        $pull: { products: { productId: id } },
      }
    );

    res.json({ status: true });
  } catch (error) {
    console.log(`error in removing wishlist item : ${error}`);
  }
};

// LOAD COUPON

const loadCoupon = async(req , res) => {
    try {
        const couponData = await Coupon.find()
        res.render('coupons')
    } catch (error) {
       console.log(`error in loading coupn : ${error}`); 
    }
}

//  LOGOUT

const logOut = async (req, res) => {
  try {
    console.log("logyyy");
    req.session.email = null;
    res.redirect("/login");
  } catch (error) {
    console.log(`error in logout : ${error}`);
  }
};

module.exports = {
  home,
  userLogin,
  userSignup,
  userSignupPost,
  loadOtp,
  verifyLogin,
  resendOtp,
  forgotPassword,
  PostForgotpass,
  productDetails,
  verifyOtp,
  accountDetails,
  addAddress,
  orders,
  userAddress,
  postAddress,
  deleteAddress,
  editAddress,
  postEditaddress,
  changePassword,
  viewAccount,
  editAccount,
  postEditAccount,
  allProducts,
  logOut,
  changePass,
  whishlist,
  addWishlist,
  removeWishlist,
  loadCoupon
};
