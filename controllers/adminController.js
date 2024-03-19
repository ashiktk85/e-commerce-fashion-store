// const admin = require('../')
const User = require('../models/userModel')
const adminEmail = process.env.adminEmail;
const adminPassword = process.env.adminPassword;



const adminLogin = async (req, res) => {
    try {
        if (req.session.admin) {
            res.render('adminhome')
        } else {
        res.render('adminLogin')
        }
    } catch (error) {
        console.log(`There was an error in rendering admin login page : ${error}`);
    }
}


const verifyAdmin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        console.log(email);

        if (email == adminEmail && password == adminPassword) {
            req.session.admin = email;
            req.session.admin = password;
            res.redirect('/admin/adminDashboard');
        } else {
            res.json({
                message: "error in pass or email"
            })
        }
    } catch (error) {
        console.log(`There was an error in verifying admin login : ${error}`);
    }
}

const adminHome = async (req, res) => {
    try {
        res.render('adminhome');
    } catch (error) {
        console.log(`There was an error in loading admin dashboard : ${error}`);
    }
}


const userDetails = async (req, res) => {
    try {
        const userDetails = await User.find({});
        // console.log(userDetails);
        res.render('userDetails', { userDetails })
    } catch (error) {
        console.log(`There was an error in loading user details : ${error}`);
    }
}

const blockUser = async (req, res) => {
    try {
        const id = req.query.id;
        const findUser = await User.findById({ _id: id });
        

        if (findUser.is_blocked == false) {
            const userData = await User.updateOne({ _id: id },{is_blocked : true})
        } res.redirect('/admin/userDetails')
    } catch (error) {
        console.log(`There was an error in blocking user : ${error}`);
    }
}

const unblockUser = async (req, res) => {
    try {
        const id = req.query.id;
        const findUser = await User.findById({ _id: id });
        console.log(findUser);
        if (findUser.is_blocked == true) {
            const userData = await User.updateOne({ _id: id },{is_blocked : false})

        } res.redirect('/admin/userDetails')
    } catch (error) {
        console.log(`There is an error in unblocking user : ${error}`);
    }
}

// ADMIN LOGOUT 

const logout = async (req, res) => {
    try {
      delete req.session.admin;
      res.redirect("/admin");
    } catch (error) {
      console.log(error);
    }
  };


module.exports = {
    adminHome,
    adminLogin,
    verifyAdmin,
    userDetails,
    blockUser,
    unblockUser,
    logout
}