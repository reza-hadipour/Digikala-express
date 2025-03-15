const express = require('express');
const router = express.Router();
const { addProductToBasket, getProductInBasket, removeProductFromBasket } = require('./basket.service');
const { addToBasketValidator, removeFromBasketValidator } = require('./basket.validator');
const { validation } = require('../../middlewares/validation.middleware');

// Route to add a product to the basket
router.post('/addToBasket', addToBasketValidator(), validation, addProductToBasket);
router.post('/removeFromBasket',removeFromBasketValidator(), validation, removeProductFromBasket);
router.get('/', getProductInBasket);

module.exports = {
    basketRouter : router
};
