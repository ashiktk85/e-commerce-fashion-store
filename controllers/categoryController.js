const Category = require('../models/categoryModel');

const loadCategory = async (req, res) => {
    try {
        const catData = await Category.find({});
        res.render("adminCategory", { catData })
    } catch (error) {
        console.log(error.message);
    }
}




// const addCategory = async (req, res) => {
//     try {
//         const name = req.body.name;
//         const dis = req.body.dis;

//         // Check if the name is empty or contains only spaces
//         if (!name || name.trim() === '') {
//             const  nameErr = "Name cannot be empty" ;
//              res.render('adminCategory', {nameError : "Name cannot be empty"})
//         }
//         if(!dis || dis.trim() === " ") {
//             res.render('adminCategory', {nameError : "Description  cannot be empty"})
//         }

//         const allData = await Category.find({});    

//         // Use filter to exclude undefined or null names
//         const validNames = allData.filter((x) => x && x.name).map((x) => x.name.toLowerCase());

//         const isUnique = !validNames.includes(name.toLowerCase());

//         if (isUnique) {
//             const cat = new Category({
//                 name: name,
//                 discription: dis,
//             });

//             const catData = await cat.save();
//             console.log(catData);

//             res.render('adminCategory', {nameError : "Category added"})
//         } else if(!isUnique) {
//             res.render('adminCategory', {nameError : "category name already exists"})
//         } else {
//             res.render('adminCategory', {catData})
//         }
        
//     } catch (error) {
//         console.error(`Error in addCategory: ${error.message}`);
//         res.status(500).json({ status: "error", message: "Internal Server Error" });
//     }
// };

const addCategory = async (req, res) => {
    try {
        // Retrieve catData at the beginning
        const catData = await Category.find({});
        
        const name = req.body.name;
        const dis = req.body.dis;

        // Check if the name is empty or contains only spaces
        if (!name || name.trim() === '') {
            return res.render('adminCategory', { nameError: "Name cannot be empty", catData });
        }
        if (!dis || dis.trim() === " ") {
            return res.render('adminCategory', { nameError: "Description cannot be empty", catData });
        }

        // Use filter to exclude undefined or null names
        const validNames = catData.filter((x) => x && x.name).map((x) => x.name.toLowerCase());

        const isUnique = !validNames.includes(name.toLowerCase());

        if (isUnique) {
            const cat = new Category({
                name: name,
                discription: dis,
            });

            // Save the new category
            const savedCat = await cat.save();
            console.log(savedCat);

            return res.render('adminCategory', { nameError: "Category added", catData: [savedCat, ...catData] });
        } else {
            return res.render('adminCategory', { nameError: "Category name already exists", catData });
        }

    } catch (error) {
        console.error(`Error in addCategory: ${error.message}`);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
};




const listCat = async (req, res) => {
    try {
        // console.log("list Id"+req.body.catId)

        const id = req.body.catId

        // console.log(id)

        const findCat = await Category.findById({ _id: id })

        if (findCat.is_blocked === true) {
            const catData = await Category.findByIdAndUpdate({ _id: id }, {
                $set: {
                    is_blocked: false
                }
            })
        } else {
            const catData = await Category.findByIdAndUpdate({ _id: id }, {
                $set: {
                    is_blocked: true
                }
            })
        }

        res.json({ status: true })



    } catch (error) {
        console.log(error.message)
    }
}

const loadEdit = async (req, res) => {
    try {
        const id = req.query.id
        // console.log(id)

        const catData = await Category.findById({ _id: id })

        // console.log(catData)
        const { name, discription } = catData

        const data = {
            name,
            discription
        }

        req.session.catData = data

        req.session.save();

        res.render("editCategory", { catData })

    } catch (error) {
        console.log(error.message)
    }
}

const editCat = async (req, res) => {
    try {


        const name = req.body.name
        const description = req.body.description
        const id = req.body.id

        console.log(name)
        console.log(description)
        console.log(id)

        const allData = await Category.find({})

        const allName = allData.map((x) => x.name)

        let unique = false;
        for (i = 0; i < allName.length; i++) {
            if (name.toLowerCase() == allName[i].toLowerCase()) {
                unique = true
            }
        }

        if (name == req.session.catData.name) {
            unique = false;
        }


        if (unique) {
            // console.log("hello");
            res.json({ status: "unique" })
        } else {

            const catData = await Category.findOneAndUpdate({ _id: id }, {
                $set: {
                    name: name,
                    description
                }
            })

            res.json({ status: true })
        }


    } catch (error) {
        console.log(error.message)
    }
}

const cancelCat = async (req, res) => {
    try {

        const newName = req.body.name
        const newDis = req.body.description

        const { name, discription } = req.session.catData

        if (newName == name && newDis == discription) {
            res.json({ status: "Nothing" })
        } else {
            res.json({ status: true })
        }


    } catch (error) {
        console.log(error.message)
    }
}



module.exports = {
    loadCategory,
    addCategory,
    listCat,
    editCat,
    loadEdit,
    cancelCat
}