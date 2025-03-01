const express = require('express');
const router = express.Router();
const { addToBasket } = require('./basket.service');

// Route to add a product to the basket
router.post('/addToBasket', addToBasket);

module.exports = router;
