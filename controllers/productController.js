const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require("../models/cartModel")



const loadProduct = async (req, res) => {
    try {
        const proData = await Product.find({});
        const catData = await Category.find({})

        console.log()


        res.render('adminProduct', { proData, catData })
    } catch (error) {
        console.log(`Error in loading admin products page ${error}`);
    }
}

const loadAddpro = async (req, res) => {
    try {

        const proData = await Product.find({})

        const catData = await Category.find({ is_blocked: false })
        res.render('addProduct', { catData })
        console.log("jfckdgfjcvhj");

    } catch (error) {
        console.log(`Error in loading product add page ${error}`);
    }
}

const loadEdit = async (req, res) => {
    try {
        const id = req.query.id;
        req.session.id = id;
        const proData = await Product.findById({ _id: id });
        const Cat = await Category.findOne({ _id: proData.category })
        const catData = await Category.find({ is_blocked: false, name: { $ne: Cat.name } });

        
        res.render("editProduct", { catData, proData , catName : Cat.name})
    } catch (error) {
        console.log(`error in load edit product controller ${error.message}`);
    }
}


const addProduct = async (req, res) => {
    try {
        console.log('getting hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');

        const { product_name, product_dis, regprice, offprice, catName, small, medium, large } = req.body;

        // const catData =  await Category.find({});
        console.log(catName);

        const Cat = await Category.findById({ _id: catName })



        const imageName = req.files.map((x) => x.originalname);

        const product = new Product({
            name: product_name,
            discripiton: product_dis,
            regularPrice: regprice,
            offerPrice: offprice,
            image: imageName,
            category: Cat._id,
            size: {
                s: {
                    quantity: small,
                },
                m: {
                    quantity: medium,
                },
                l: {
                    quantity: large,
                },
            },
            is_blocked: false,
        });


        const proData = await product.save();
        console.log(proData);
        if (proData) {
            return res.redirect("/admin/adminProduct");
        }


    } catch (error) {
        console.log(`Error: `, error.message);
        return res.status(500).render('addProduct', { errorMessage: 'Internal Server Error' });
    }
};




const editPro = async (req, res) => {
    try {
        const id = req.params.id; 
        const { product_name, product_dis, regprice, offprice, catName, small, medium, large } = req.body;

        console.log(id);
        let imageName = [];

        // Check if files are provided in the request
        if (req.files && req.files.length > 0) {
            imageName = req.files.map((x) => x.originalname);
        } else {
            // If no new files are provided, retain existing images
            const proData = await Product.findById(id);
            if (proData && proData.image && proData.image.length > 0) {
                imageName = proData.image;
            }
        }

        const catData = await Category.findOne({ name: catName });

        const updatePro = await Product.findByIdAndUpdate(
            { _id: id },
            {
                $set: {
                    name: product_name,
                    discripiton: product_dis,
                    regularPrice: regprice,
                    offerPrice: offprice,
                    image: imageName,
                    category: catData ? catData._id : null, // Ensure catData is not undefined
                    size: {
                        s: { quantity: small },
                        m: { quantity: medium },
                        l: { quantity: large },
                    },
                    is_blocked: false,
                },
            }
        );

        if (updatePro) {
            res.redirect("/admin/adminProduct");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};



const blockPro = async (req, res) => {
    try {
        const id = req.query.id
        const findPro = await Product.findByIdAndUpdate(id, { is_blocked: false })
        console.log('blokced product', findPro);
        res.redirect("/admin/adminProduct")

    } catch (error) {
        console.log(error.message)
    }
}


const unblockPro = async (req, res) => {
    try {
        const id = req.query.id
        const findPro = await Product.findByIdAndUpdate(id, { is_blocked: true })
        console.log('unblokced product', findPro);
        res.redirect("/admin/adminProduct")
    } catch (err) {
        console.log(err.message);
    }
}

const detailedPro = async (req, res) => {
    try {
       
        const id = req.query.id;
        console.log(id);
        const proData = await Product.findById({ _id: id })
        const Cat = await Category.findOne({ _id: proData.category })
        res.render('detailedProduct', { proData, catName: Cat.name })
    } catch (error) {
        console.log(`error in rendering detailed product page: ${error}`);
    }
}



module.exports = {
    loadProduct,
    loadAddpro,
    addProduct,
    loadEdit,
    blockPro,
    editPro,
    unblockPro,
    detailedPro
}