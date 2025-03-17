const { getOrders, orderStatusPayed, progressOrderStatus } = require('./order.service');

const router = require('express').Router();

// Show all orders by filtering them
router.get('/', getOrders)

// Change order status
// Only Order manager can access this
router.patch('/pay/:id',orderStatusPayed)
router.patch('/progress/:id',progressOrderStatus)

// Cancel Order
// router.put('/:id',)

module.exports = {
    OrderRouter : router
}