const router = require('express').Router();
const {authRouter} = require('../modules/auth/auth.routes');
const {productRouter} = require('../modules/product/product.routes');

router.use('/product', productRouter)
router.use('/auth',authRouter)

module.exports = router;