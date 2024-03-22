const Wallet  = require('../models/walletModel');
const User = require('../models/userModel');

const loadWallet = async(req, res) => {
    try {
        res.render('wallet')
    } catch (error) {
        console.log(`Error in loading wallet page : ${error.message}`);
    }
}

module.exports = {
    loadWallet
}