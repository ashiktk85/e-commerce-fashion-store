const Product = require('../models/productModel');
const Category = require('../models/categoryModel');



const loadProduct = async (req, res) => {
    try {
        const proData = await Product.find({});
        const catData = await Category.find({})

        console.log()

        
        res.render('adminProduct', {proData,catData})
    } catch (error) {
        console.log(`Error in loading admin products page ${error}`);
    }
}

const loadAddpro = async (req, res) => {
    try {
        
        const proData  =await Product.find({})
        console.log(proData);
        const catData = await Category.find({is_blocked:false})
        res.render('addProduct',{catData})
        console.log("jfckdgfjcvhj");

    } catch (error) {
        console.log(`Error in loading product add page ${error}`);
    }
}

const loadEdit = async (req, res) => {
    try {
        const id = req.query.id;
        req.session.id = id;
        const proData = await Product.findById({ _id : id});
        const catData = await Category.find({is_blocked : false});
        console.log(catData);
        res.render("editProduct",{catData,proData})
    } catch (error) {
        console.log(`error in load edit product controller ${error.message}`);
    }
}


const addProduct = async (req, res) => {
    try {
        console.log('getting hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');

        const { product_name, product_dis, regprice, offprice, catName, small, medium, large } = req.body;
        
        // const catData =  await Category.find({});
        
       
        const imageName = req.files.map((x) => x.originalname);

        const product = new Product({
            name: product_name,
            discripiton: product_dis,
            regularPrice: regprice,  
            offerPrice: offprice,
            image: imageName,
            category: catName,
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

        console.log("eeeeeeedittttttttttttttttttttttttttt")
        
        const id = req.query.id;
        console.log(id);

        

        // const catData = await Category.find();

        const images = req.files;
        console.log(images);
        const imageName = images ? images.map((x) => x.originalname) : [];
        console.log(imageName);

        console.log(req.body.catName);

        const catData=await Category.findOne({})
        console.log(catData);
        console.log("reached here...");

        const proData = await Product.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    name: req.body.product_name,
                    discripiton: req.body.product_dis,
                    regularPrice: req.body.regprice,
                    offerPrice: req.body.offprice,
                    category: catData._id,
                    size: {
                        s: {
                            quantity: req.body.small,
                        },
                        m: {
                            quantity: req.body.medium,
                        },
                        l: {
                            quantity: req.body.large,
                        },
                    },
                },
            }
        );

        console.log("pppppppppppppprrrrrrrrrrrrrrrrrrrrrrrrrrrooooooooooooooooooooooooooooo");

        if (images && images.length > 0) {
            await Product.findByIdAndUpdate({ _id: id }, { $push: { image: { $each: imageName } } });
        }

        if(proData) {
            res.redirect("/admin/adminProduct");
        }

        
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

const blockPro=async(req,res)=>{
    try {
        const id=req.query.id
        const findPro=await Product.findByIdAndUpdate(id,{is_blocked:false})
        console.log('blokced product',findPro);
        res.redirect("/admin/adminProduct")
        
    } catch (error) {
        console.log(error.message)
    }
}


const unblockPro = async(req,res)=>{
    try{
        const id=req.query.id
        const findPro=await Product.findByIdAndUpdate(id,{is_blocked:true})
        console.log('unblokced product',findPro);
        res.redirect("/admin/adminProduct")
    }catch(err){
        console.log(err.message);
    }
}



module.exports = {
    loadProduct,    
    loadAddpro,
    addProduct,
    loadEdit,   
    blockPro,
    editPro,
    unblockPro
}