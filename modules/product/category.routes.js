const { authenticate } = require('../../middlewares/auth.middleware');
const { validation } = require('../../middlewares/validation.middleware');
const { createCategory, getCategories } = require('./product.service');
const { createCategoryValidator } = require('./product.validator');

const router = require('express').Router();

router.post('/',createCategoryValidator(), validation, createCategory)
router.get('/',getCategories)

module.exports = {
    categoryRouter: router 
}