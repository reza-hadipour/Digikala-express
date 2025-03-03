const { authenticate } = require('../../middlewares/auth.middleware');
const { validation } = require('../../middlewares/validation.middleware');
const { createCategory, getCategories, createCategoryFeatures, getCategoryFeatures, truncateCategoryFeatures } = require('./product.service');
const { createCategoryValidator, createCategoryFeaturesValidator, getCategoryIdInParamValidator } = require('./product.validator');

const router = require('express').Router();

router.post('/',createCategoryValidator(), validation, createCategory)
router.get('/',getCategories)

router.post('/feature',createCategoryFeaturesValidator(), validation ,createCategoryFeatures)
router.get('/feature/:catId',getCategoryIdInParamValidator(), validation ,getCategoryFeatures)
router.get('/feature/trunc/:catId',getCategoryIdInParamValidator(), validation , truncateCategoryFeatures)

module.exports = {
    categoryRouter: router 
}