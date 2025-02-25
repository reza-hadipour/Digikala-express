const router = require('express').Router();
const { validation } = require('../../middlewares/validation.middleware');
const {createProduct, getProductList, getProduct, deleteProduct} = require('./product.service');
const { createProductValidator } = require('./product.validator');



router.post('/',createProductValidator() ,validation, createProduct)
router.get('/',getProductList)
router.get('/:id',getProduct)
router.delete('/:id',deleteProduct)



module.exports = {
    productRouter: router
}