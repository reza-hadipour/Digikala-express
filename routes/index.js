const router = require('express').Router();
const { productRouter } = require('../modules/product/product.routes');

router.use('/product',productRouter)


module.exports = router;