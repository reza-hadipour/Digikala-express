const express = require('express');
const router = express.Router();
const { addProductToBasket, getProductInBasket } = require('./basket.service');

// Route to add a product to the basket
router.post('/addToBasket', addProductToBasket);
router.get('/', getProductInBasket);

module.exports = {
    basketRouter : router
};
