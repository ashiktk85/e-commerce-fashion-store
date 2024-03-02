
const User = require("../models/userModel");
const otpGnerator = require("./otpGenerator");
const otp = require("./otpGenerator");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Address = require("../models/addressModel")

//********   setting of nodemailer  *************************************** */

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
    }
})


//*********   password hashing  ********************/

const passwordHashing = async (password) => {
    try {
        const securePass = await bcrypt.hash(password, 10)
        return securePass;
    } catch (error) {
        console.log(`error in hashing password ${error}`);
    }
}

//******************* home page ********************************************************** */

const home = async (req, res) => {
    try {
        const catData = await Category.find({});

        const proData = await Product.find({});

        const isAuthenticated = req.session.auth;

        res.render('home', { catData, proData, isAuthenticated })
    } catch (error) {
        console.log(error);
    }
}

//************ create account ************************************ */

const userSignupPost = async (req, res) => {
    try {
        let { email, password, name, number, confirm } = req.body;

        name = name.trim();
        email = email.trim();
        password = password.trim();
        number = number.trim();
        confirm = confirm.trim();

        const otp = otpGnerator();
        console.log(otp);


        if (name === "" || email === "" || password === "" || number === "" || confirm === "") {
            res.render('register', { message: "Feilds should not be empty." });
        } else if (password !== confirm) {
            res.render('register', { message: "Passwords do not match." });
        } else if (!/^\d{10}$/.test(number)) {
            res.render('register', { message: "Number is invalid." });
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            res.render('register', { message: "Email is invalid." });
        } else if (!/^[A-Z][a-z\s]*([A-Z][a-z\s]*)?$/.test(name)) {
            res.render('register', { message: "Name is invalid." });
        } else if (password.length < 8) {
            res.render('register', { message: "Password should contain minimum 8 characters." });
        } else {
            // Checking for user existence
            const existsEmail = await User.findOne({ email }).catch(err => console.log(`Error finding email: ${err}`));
            const existMobile = await User.findOne({ mobile: number }).catch(err => console.log(`Error finding mobile: ${err}`));
            console.log("exist email", existsEmail);

            if (existsEmail) {
                res.render('register', { message: "Email already in use." });
            } else if (existMobile) {
                res.render('register', { message: "Mobile already in use." });
            } else {

                console.log(" working just fine...")

                const newUser = {
                    name,
                    email,
                    number,
                    password,
                    confirm,
                    otp
                };

                // req.session.Data = newUser; 
                // req.session.save();


                req.session.Data = req.session.Data || {};

                // Assign new user data to req.session.Data
                Object.assign(req.session.Data, newUser);
                req.session.save();


                // Send OTP email
                const mailOptions = {
                    from: Email,
                    to: req.body.email,
                    subject: "Your OTP Verification",
                    text: `Your OTP: ${otp}`
                };

                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.log("Mail sent successfully");
                    }
                });

                console.log("User added successfully");
                res.redirect('otpVerification')
            }
        }
    } catch (error) {
        console.log(error.message);
        res.json({
            status: "Failed",
            message: "An unexpected error occurred during user registration."
        });
    }
};


//*************************** loading otp page ****************************************/

const loadOtp = async (req, res) => {
    try {
        res.render('otpVerification')
    } catch (error) {
        console.log(error);
    }
}


//*********************** post otp ***************************************************** */

const verifyOtp = async (req, res) => {
    const getOtp = req.body.otp;
    console.log(getOtp);

    if (req.session.Data) {
        if (getOtp == req.session.Data.otp) {
            const securePass = await passwordHashing(req.session.Data.password)
            const user = new User({
                name: req.session.Data.name,
                email: req.session.Data.email,
                mobile: req.session.Data.number,
                password: securePass,
            });
            const userData = await user.save();
            console.log(userData);
            res.render('login', { sucess: "OTP verified" })
        } else {
            res.render('otpVerification', { message: "Wrong otp." })
        }
    }

}


const resendOtp = async (req, res) => {
    try {
        console.log("hello");

        const email = req.session.Data.email;
        const resendOtpGen = otpGnerator();
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

        res.render('otpVerification', { resendmsg: "OTP was send again" });
    } catch (error) {
        console.log(error.message);
    }
};


// **************************** user login *****************************************************************

const userLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error);
        res.json({
            status: "Failed",
            message: "An unexpected error occurred during login."
        });
    }
};

//********************** verifying user login after otp *********************************************************************************** */

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.is_blocked == false) {
                req.session.email = email;
                console.log('verify');
                const passwordMatch = await bcrypt.compare(password, userData.password);
                if (passwordMatch) {
                    req.session.auth = true;
                    req.session.userId = userData._id;
                    res.redirect('/');
                } else {
                    res.render('login', { passErr: 'Incorrect password. Please try again.' });
                }


            } else {
                console.log('user is blocked');
                res.render('login', { blocked: 'Currently you are restricted.' });
            }
        } else {
            res.render('login', { emailErr: 'Incorrect email. Please try again.' });
        }
    } catch (error) {
        console.error(`Error in verifying login: ${error}`);
        res.status(500).send("Internal Server Error");
    }
};

const userSignup = async (req, res) => {
    try {
        res.render('register')
    } catch {
        console.log(error);
    }
}



//********************************** forgot password *************************************************************** */


const forgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword')
    } catch (error) {
        console.log(`There was an error in rendering forgotpassword page : ${error}`);
    }

}


//post forgot password

const PostForgotpass = async (req, res) => {
    try {
        const email = req.body.email;
        const newPassword = req.body.forgotPassword;
        const confirmPassword = req.body.confirmPassword;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.render('forgotPassword', { message: 'Invalid email format.' });
        }

        // Validate password length
        if (newPassword.length < 8) {
            return res.render('forgotPassword', { message: 'Password must be at least 8 characters long.' });
        }

        if (newPassword !== confirmPassword) {
            return res.render('forgotPassword', { message: 'Passwords do not match.' });
        }

        // Retrieve user from the database based on the email
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('forgotPassword', { message: 'User not found.' });
        }

        // Hash the new password before updating it in the database
        const hashedPassword = await passwordHashing(newPassword);
        user.password = hashedPassword;

        // Save the updated user information in the database
        await user.save();

        // Update the password in the session as well
        if (req.session.Data) {
            req.session.Data.password = hashedPassword;
            req.session.save();
        }

        return res.render('forgotPassword', { success: 'Password has been updated.' });
    } catch (error) {
        console.log(`There was an error in post forgot password : ${error}`);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
};



const productDetails = async (req, res) => {
    try {
        const id = req.query.id;

        const user = await User.findById({ _id: id })

        if (user) {
            if (user.is_blocked === true) {
                res.redirect('/login')
            }
        }
        const proData = await Product.findById({ _id: id });
        console.log(proData);

        const fullData = await Product.find({});

        res.render("productDetails", { proData, fullData });
    } catch (error) {
        console.log(error.message);
    }
};


//  **************  Account - Dashboard *****************

//DASHBOARD

const accountDetails = async (req, res) => {
    try {
        const id = req.session.userId;

        console.log('accound details page');
        const userData = await User.findById({ _id: id })
        console.log(userData);
        res.render('accountDetails', { userData });
    } catch (error) {
        console.log(`error in rendring account details page ${error}`);
    }
}

// VIEW ADDRESS PAGE

const userAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        console.log(userId);
        const email = req.session.email;
        console.log(email);
        const userAddress = await Address.find({ userId })

        res.render('userAddress', { userAddress })
    } catch (error) {
        console.log(`error in rendring user address page : ${error}`);
    }
}





// ADD ADDRESS PAGE

const addAddress = async (req, res) => {
    try {
        res.render('addAddress')
    } catch (error) {
        console.log(`error in rendring add address page ${error}`)
    }
}


// VIEW ORDERS PAGE

const orders = async (req, res) => {
    try {
        res.render('order')
    } catch (error) {
        console.log(`error in rendring orders page ${error}`)
    }
}


// Address POST DATA 


const postAddress = async (req, res) => {
    try {
        const { name, number, pincode, locality, address, city, state, country } = req.body;
        const userId = req.session.userId;

        // Count the number of addresses for the user
        const existingAddressesCount = await Address.countDocuments({ userId });

        if (existingAddressesCount >= 3) {

            return res.redirect('/userAddress?limitReached=true');
        }

        // Assuming you have a UserAddress model
        const userAddress = new Address({
            userId,
            name,
            mobile: number,
            pincode,
            locality,
            address,
            city,
            state,
            country
        });

        await userAddress.save();

        res.redirect('/userAddress');
    } catch (error) {
        console.log(`error in getting address data post: ${error}`);
    }
};

const deleteAddress = async (req, res) => {
    try {
        console.log("itsugcvkgcfkgdfdjsdr");
        const id = req.query.id;

        const dele = await Address.findByIdAndDelete({ _id: id })
        console.log(id);
        res.redirect('/userAddress')
    } catch (error) {
        console.log(`error in post delete address : ${error}`)
    }
}

const editAddress = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id);
        const userAddress = await Address.findById({ _id: id })
        console.log(`itds lsdnlsndojsjdnffojsdn`, userAddress);

        req.session.Address = userAddress;

        res.render('editAddress', { userAddress })
    } catch (error) {
        console.log(`error in geting edit address : ${error}`)
    }
}

// POST EDIT ADDRESS



const postEditaddress = async (req, res) => {
    try {
        console.log("postyy address");

        const { name, number, pincode, locality, address, city, state, country } = req.body;
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
            const sameNme = "No changes made, Make changes to update."
            res.render('editAddress', { sameNme, userAddress });
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
                        country
                    }
                },
                { new: true } // Return the modified document
            );

            // Redirect to user's address page with the updated address
            res.redirect('/userAddress');
        }
    } catch (error) {
        console.log(`error in post edit address : ${error}`);
        // Handle errors and send an appropriate response
        res.redirect('/userAddress?message=Error updating address. Please try again.'); // Redirect to the user's address page with an error message
    }
};

//  CHANGE PASSWORD 


const changePassword = async (req, res) => {
    try {
        res.render('changePassword')
    } catch (error) {
        console.log(`error in rnder change password : ${error}`);
    }
}


//            VIEW ACCOUNT

const viewAccount = async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email })
        res.render('viewAccount', { userData })
    } catch (error) {
        console.log(`error in view account : ${error}`);
    }
}

// POST EDIT ACCOUNT

const editAccount = async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email : email})
        res.render('editAccount', { userData })
    } catch (error) {
        console.log(`error in rendering edit account : ${error}`);
    }
}

const postEditAccount = async (req, res) => {
    try {
        console.log("4rrrrrrrrrrrrrrrrrrr");
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        console.log(userData);

        const { name, phone } = req.body;

        // if (name === userData.name && phone === userData.mobile) {
        //     const message = "No changes made, change to save.";
        //     res.render('editAccount', { userData, message });
        // } else {
           const Data =  await User.findOneAndUpdate(
                { email: email },
                {
                    $set: {
                        name: name,
                        mobile: phone
                    }
                }
            );
            console.log(Data);
            res.redirect('/viewAccount');
        
    } catch (error) {
        console.error(`Error in getting post data from edit account: ${error}`);
        // Handle the error response or redirect to an error page
        res.status(500).send('Internal Server Error');
    }
};


//   PRODUCTS PAGE ALL

const allProducts = async(req, res ) => {
    try {
        res.render('allProducts')
    } catch (error) {
       console.log(`error in logging all products page : ${error}`); 
    }
}






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
    allProducts

};