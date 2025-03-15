const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {authRouter} = require('../modules/auth/auth.routes');
const { categoryRouter } = require('../modules/product/category.routes');
const {productRouter} = require('../modules/product/product.routes');
const { basketRouter } = require('../modules/basket/basket.routes');
const {payRouter} = require('../modules/payment/payment.routes');

router.use('/product',authenticate, productRouter)
router.use('/cart',authenticate, basketRouter)
router.use('/category',categoryRouter)
router.use('/auth',authRouter)
router.use('/pay', payRouter)

module.exports = router;