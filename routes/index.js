const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {authRouter} = require('../modules/auth/auth.routes');
const {productRouter} = require('../modules/product/product.routes');


router.use('/product',authenticate, productRouter)
router.use('/auth',authRouter)

module.exports = router;