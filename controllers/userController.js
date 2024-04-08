const User = require("../models/userModel");
const generateOTP = require("./otpGenerator");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Orders = require("../models/orderModel");
const Wishlist = require("../models/wishlistModel");
const Coupon = require("../models/couponModel");
const referralCode = require("./referralCode");
const generateDate = require("../controllers/dateGenerator");
const generateTransaction = require("./transactionId");
const Wallet = require('../models/walletModel')

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

    const proData = await Product.find({is_blocked : false }).limit(8);

    console.log(proData);




    const cartData = await Cart.find({});

    const isAuthenticated = req.session.email;

    res.render("home", { catData, proData, isAuthenticated, cartData, });
  } catch (error) {
    console.log(error);
  }
};

// CREATE ACCOUNT

const userSignupPost = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mob;
    const password = req.body.pass;
    const confirm = req.body.confirm;
    const reffer = req.body.reffer;
    console.log(req.body, "bodyyyyy");

    const otp = generateOTP.otpGnerator(); // Generate OTP
    console.log(otp);
    const otpTime = Date.now(); // Record current time as OTP creation time

    const existsEmail = await User.findOne({ email: email });
    const existsMobile = await User.findOne({ mobile: mobile });

    if (existsEmail) {
      res.json({ status: "emailErr" });
    } else if (existsMobile) {
      res.json({ status: "mobilErr" });
    } else {
      if (reffer != "") {
        const searchReffer = await User.findOne({ referralCode: reffer });
        if (searchReffer) {
          const data = {
            name,
            email,
            mobile,
            password,
            confirm,
            reffer,
            otp,
            otpTime, // Store OTP creation time in session data
          };

          req.session.Data = data;
          req.session.save();
          res.json({ status: true });
        } else {
          res.json({ status: "reffer" });
        }
      } else {
        const data = {
          name,
          email,
          mobile,
          password,
          confirm,
          otp,
          otpTime, 
        };
        req.session.Data = data;
        req.session.save();
        res.json({ status: true });
      }
    }

    // Send OTP to user's email
    const mailOptions = {
      from: Email,
      to: req.body.email,
      subject: "Your OTP for Verification",
      html: `
        <div style="font-family: Helvetica, Arial, sans-serif; min-width: 100px; overflow: auto; line-height: 2">
            <div style="margin: 50px auto; width: 70%; padding: 20px 0">
                <p style="font-size: 1.1em">Hi ${email},</p>
                <p>This message from Kevin Hills. Use the following OTP to complete your register procedures. OTP is valid for 1 minute</p>
                <h2 style="background: #00466a; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp.otp}</h2>
                <p style="font-size: 0.9em;">Regards,<br />KEVIN HILLS</p>
                <hr style="border: none; border-top: 1px solid #eee" />
            </div>
        </div>`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err.message);
      } else {
        console.log("Mail sent successfully");
      }
    });
  } catch (error) {
    console.log(error);
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

    const resendOtpGen = generateOTP.otpGnerator();

    // Update the session data with the new OTP
    req.session.Data.otp = resendOtpGen;
    req.session.save();

    console.log("new resend otp", resendOtpGen);

    const mailOptions = {
      form: Email,
      to: email,
      subject: "Your new OTP for Verification",
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

    res.json({status : true });
  } catch (error) {
    console.log(error.message);
  }
};

// VERIFY OTP

const verifyOtp = async (req, res) => {
  try {
    const getOtp = req.body.otp;
    console.log(getOtp);
    const date = generateDate();
    const Tid = generateTransaction();

    if (req.session.Data) {
      const storedOtpData = req.session.Data.otp.otp;
      const otpTime = req.session.Data.otpTime;
      console.log("Stored OTP Data:", storedOtpData, "OTP Time:", otpTime);

      const currentTime = Date.now();
      const otpExpiryDuration = 60000;

      if (getOtp == storedOtpData) {
        // OTP verification successful
        // Proceed with user registration
        const referral = referralCode(8);
        console.log(referral, "referral");

        const securePass = await passwordHashing(req.session.Data.password);
        const user = new User({
          name: req.session.Data.name,
          email: req.session.Data.email,
          mobile: req.session.Data.mobile,
          password: securePass,
          referralCode: referral,
          createdOn : date
        });

        const userData = await user.save();
        console.log("User Data:", userData);

        if (req.session.Data.reffer) {
          const findUser = await User.findOne({ referralCode: req.session.Data.reffer });
          const findUserWallet = await Wallet.findOne({ userId: findUser._id });

          if (findUserWallet) {
            const updateWallet = await Wallet.findOneAndUpdate(
              { userId: findUser._id },
              {
                $inc: {
                  balance: 200
                },
                $push: {
                  transactions: {
                    id: Tid,
                    date: date,
                    amount: 200
                  }
                }
              }
            );

            const newUser = await User.findOne({ email: req.session.Data.email });
            const forNewWallet = new Wallet({
              userId: newUser._id,
              balance: 100,
              transactions: [{
                id: Tid,
                date: date,
                amount: 100
              }]
            });

            await forNewWallet.save();
          } else {
            console.log("else worked");
            const createWallet = new Wallet({
              userId: findUser._id,
              balance: 200,
              transactions: [{
                id: Tid,
                date: date,
                amount: 200
              }]
            });

            await createWallet.save();

            const newUser = await User.findOne({ email: req.session.Data.email });
            const forNewWallet = new Wallet({
              userId: newUser._id,
              balance: 100,
              transactions: [{
                id: Tid,
                date: date,
                amount: 100
              }]
            });

            await forNewWallet.save();
          }
        }

        delete req.session.otpData;

        return res.status(200).json({ status: true, message: "OTP verification successful" });
      } else {
        return res.status(400).json({ status: false, message: "Incorrect OTP. Please try again." });
      }
    } else {
      return res.status(400).json({ status: false, message: "Session expired. Please request a new OTP." });
    }
  } catch (error) {
    console.error(`Error in OTP verification: ${error}`);
    return res.status(500).json({ success: false, message: "An error occurred. Please try again later." });
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

// OTP SEND FOR FORGOT PASS (POST)
const sendOtpForgotpass = async (req, res) => {
  try {
    console.log("getting to forgot pass otp");
    const { email } = req.body;

    console.log(email);

    const existEmail = await User.findOne({ email: email });
    console.log(existEmail);

    if (!existEmail) {
      console.log("inside exists");
      return res.json({ status: "email_error" });
    } else {
      const otp = generateOTP.otpGnerator();
      console.log("otp is", otp.otp);
      req.session.OTP = otp.otp;
      req.session.F_EMAIL = req.body;
      req.session.save();

      const mailOptions = {
        from: Email,
        to: email,
        subject: `Your otp for forgot password : ${otp.otp} `,
      };
      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.log(err.message);
          return res.json({ status: "error_sending_mail" });
        } else {
          console.log("Mail sent successfully");
          return res.json({ status: "success" });
        }
      });
    }
  } catch (error) {
    console.log("error in sending otp forget password:", error.message);
    return res.json({ status: "server_error" });
  }
};

// POST FORGOT PASSWORD

const PostForgotpass = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(email, otp, "bodyyyy");

    const realOtp = req.session.OTP;
    console.log(realOtp);

    if (realOtp == otp) {
      return res.json({ status: true });
    } else {
      return res.json({ status: "wrong_otp" });
    }
  } catch (error) {
    console.log("error in post forgot password otp", error.message);
  }
};

// LOAD FORGET PASS

const loadForget = async (req, res) => {
  try {
    res.render("forgetpassVerification");
  } catch (error) {
    console.log(`error in loadng forget pass page : ${error.message}`);
  }
};

// PRODUCT DETAILS

const productDetails = async (req, res) => {
  try {
    console.log("Getting product details");

    const userData = await User.findOne({ email: req.session.email });
    const id = req.query.id;

    const viewCart = await Cart.find();

    const proData = await Product.findById(id);
    if (proData && proData.is_blocked) {
      res.redirect("/");
      return;
    }

    const cartData = await Cart.findOne({
      userId: userData._id,
      "items.productsId": id,
    });

    const category = await Category.findById(proData.category);

    res.render("productDetails", {
      proData,
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

// POST VERIFY FORGOT PASS

const verifyForgotpass = async (req, res) => {
  try {
    console.log("Getting to post verify forgot password...");
    const { password } = req.body;
    console.log(password, "password");

    if (!req.session.F_EMAIL || !req.session.F_EMAIL.email) {
      return res.status(400).json({ error: "Email not found in session." });
    }

    const email = req.session.F_EMAIL.email;
    console.log(email, "email");

    const user = await User.findOne({ email: email });
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const passwordHash = await passwordHashing(password);

    const updatedUser = await User.findByIdAndUpdate(
      { _id: user._id },
      { $set: { password: passwordHash } },
      { new: true }
    );

    if (updatedUser) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: "Failed to update password." });
    }
  } catch (error) {
    console.log(`Error in post verify forgot password: ${error.message}`);
    return res.status(500).json({ error: "Internal server error." });
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
    const cart = req.session.cart;
    const wish = req.session.wish;
   
    const page = req.query.next || 1; 
    const pre = req.query.pre || 0;

    let number = 0;
    if (page != 0) {
      number = parseInt(page);
    } else if (pre != 0) {
      number = parseInt(pre) - 2;
    }
    const skip = (number - 1) * 8; 

    console.log("PAGE", page);
    console.log("SKIP", skip);

    const sort = req.query.sort;
    const categoryName = req.query.category;

    let proData;
    let totalProducts;

    if (categoryName) {
      const category = await Category.findOne({ name: categoryName }).select('_id');
      if (!category) {
        return res.status(404).send("Category not found");
      }

      totalProducts = await Product.countDocuments({ category: category._id });

      if (sort == "lowToHigh") {
        proData = await Product.find({ category: category._id }).sort({ offerPrice: 1 }).skip(skip).limit(12);
      } else if (sort == "highToLow") {
        proData = await Product.find({ category: category._id }).sort({ offerPrice: -1 }).skip(skip).limit(12);
      } else if (sort == "aA-zZ") {
        proData = await Product.find({ category: category._id }).sort({ name: 1 }).skip(skip).limit(12);
      } else if (sort == "zZ-aA") {
        proData = await Product.find({ category: category._id }).sort({ name: -1 }).skip(skip).limit(12);
      } else {
        proData = await Product.find({ category: category._id }).skip(skip).limit(12);
      }
    } else {
      totalProducts = await Product.countDocuments({});
      
      if (sort == "lowToHigh") {
        proData = await Product.find({}).sort({ offerPrice: 1 }).skip(skip).limit(12);
      } else if (sort == "highToLow") {
        proData = await Product.find({}).sort({ offerPrice: -1 }).skip(skip).limit(12);
      } else if (sort == "aA-zZ") {
        proData = await Product.find({}).sort({ name: 1 }).skip(skip).limit(12);
      } else if (sort == "zZ-aA") {
        proData = await Product.find({}).sort({ name: -1 }).skip(skip).limit(12);
      } else {
        proData = await Product.find({}).skip(skip).limit(12);
      }
    }

    const categories = await Category.find({});
    const newPro = await Product.find({}).sort({ _id: -1 }).limit(3);

    let previous = skip > 0;
    let nextPage = (skip + 8) < totalProducts;
    let newNum = number + 1;

    res.render("allProducts", { cart, wish, categories, proData, newPro, newNum, previous, nextPage, sort, categoryName });
  } catch (error) {
    console.log(`Error in logging all products page: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};



// SEARCH PRODUCTS

const searchProducts = async (req, res) => {
  try {
    console.log("hello");
    const { searchDataValue } = req.body;
    const searchProducts = await Product.find({
      name: {
        $regex: searchDataValue,
        $options: "i",
      },
    });
    // console.log(searchProducts);
    console.log(searchProducts);
    res.json({ status: "searched", searchProducts });
  } catch (err) {
    console.log(err);
  }
};

// WISHLIST

const whishlist = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const wishData = await Wishlist.findOne({ user_id: user._id });

    if (!wishData || wishData.products.length === 0  ) {
      return res.render("wishlist", { wishData, proData: [] });
    }

    let proId = [];

    for (let i = 0; i < wishData.products.length; i++) {
      proId.push(wishData.products[i].productId);
    }

    let proData = [];

    for (let i = 0; i < proId.length; i++) {
      const product = await Product.findOne({ _id: proId[i], is_blocked: false });
      if (product) {
        proData.push(product);
      }
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

const loadCoupon = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });

    const allCoupons = await Coupon.find({isActive : true });

    const couponData = allCoupons.filter(
      (coupon) => !coupon.users.includes(user.id)
    );
    const readeemCoupon = allCoupons.filter((coupon) =>
      coupon.users.includes(user.id)
    );

    console.log(couponData);
    console.log(readeemCoupon);

    res.render("coupons", { couponData, readeemCoupon });
  } catch (error) {
    console.log(`error in loading coupon: ${error}`);
  }
};

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
  loadCoupon,
  sendOtpForgotpass,
  loadForget,
  verifyForgotpass,
  searchProducts,
};
