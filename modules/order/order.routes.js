const PERMISSIONS = require('../../common/constants/permissions.const');
const { guard } = require('../../middlewares/guard.middleware');
const { getOrdersHandler, orderStatusPayedHandler, progressOrderStatusHandler } = require('./order.service');

const router = require('express').Router();

// Show all orders by filtering them
router.get('/', guard(PERMISSIONS.ORDER_VIEW), getOrdersHandler)

// Change order status
// Only Order manager can access this
router.patch('/pay/:id',orderStatusPayedHandler)
router.patch('/progress/:id',progressOrderStatusHandler)

// Cancel Order
// router.put('/:id',)

module.exports = {
    OrderRouter : router
}