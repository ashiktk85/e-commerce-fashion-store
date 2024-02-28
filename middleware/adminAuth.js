const isAdmin = (req, res, next) => {
    try {
        if (req.session.admin) {


            next()
        } else {

            res.redirect("/admin")
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = isAdmin