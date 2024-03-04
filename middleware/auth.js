const User = require('../models/userModel');

const isLogin = async (req, res , next) => {
    try {
        if(req.session.email) {
            next();
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(`There was an error in isLogin ${error.message}`);
    }
}

const isLogOut=async(req,res,next)=>{
    try {
      
         if(req.session.email){
            console.log("iiiiiiiiiiiiisssssssssssssssssslogout")
           res.redirect("/")
        }else{
          console.log("isLOGGIN")
            next()
        }
    } catch (error) {
        console.log(error.message)
    }
}

const isBlocked = async (req, res, next) => {
    try {
        if(req.session.email) {
            const findUser = await User.findOne({email : req.session.email});

            if(findUser) {
                if(findUser?.is_blocked == true) {
                    console.log("isBlocked");
                    res.render('login')
                } else {
                    next()
                }
            }
        } else {
            next();
        }
    } catch (error) {
        console.log(`There was an error in isBlocked ${error.message}`);
    }
}

module.exports = {
    isBlocked,
    isLogin,
    isLogOut
}