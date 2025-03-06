const express = require('express');
const router = express.Router();
const { addProductToBasket } = require('./basket.service');

// Route to add a product to the basket
router.post('/addToBasket', addProductToBasket);

module.exports = {
    basketRouter : router
};
