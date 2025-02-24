const router = require('express').Router();
const { validation } = require('../../middlewares/validation.middleware');
const {createProduct} = require('./product.service');
const { createProductValidator } = require('./product.validator');



router.post('/',createProductValidator() ,validation, createProduct)

module.exports = {
    productRouter: router
}