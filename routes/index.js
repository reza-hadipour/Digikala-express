const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {authRouter} = require('../modules/auth/auth.routes');
const { categoryRouter } = require('../modules/product/category.routes');
const {productRouter} = require('../modules/product/product.routes');
const { basketRouter } = require('../modules/basket/basket.routes');
const {payRouter} = require('../modules/payment/payment.routes');
const { RbacRouter } = require('../modules/RBAC/rbac.routes');
const { OrderRouter } = require('../modules/order/order.routes');

router.use('/product',authenticate, productRouter)
router.use('/cart',authenticate, basketRouter)
router.use('/category',categoryRouter)
router.use('/pay', payRouter)
router.use('/order',authenticate, OrderRouter)

router.use('/auth',authRouter)
router.use('/rbac', authenticate, RbacRouter)

module.exports = router;