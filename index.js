const express = require('express');
const session = require('express-session')
const path = require('path')
const app = express();
const nocache = require("nocache");
const connectDB = require('./database/connection');
var cookieParser = require('cookie-parser')


require('dotenv').config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;




connectDB();

app.set( "view engine", "ejs")

app.use(express.static(path.join(__dirname,"public")))
app.use(express.static(path.join(__dirname,"views")))

app.use(nocache());
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());



//session
app.use(session({
    secret : "key",
    resave : false,
    saveUninitialized : false,
    cookie : { maxage : 6000000}
}));




const PORT = process.env.PORT || 7777;





// ROUTES

//user route
const userRoute = require('./router/userRouter')
app.use('/',userRoute);

// admin route
const adminRoute = require('./router/adminRoute');
app.use('/admin', adminRoute);

// app.use((req, res, next) => {
//     console.log(req.body);
//     console.log(req.session);
//     next();
// })


app.listen( PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
})

