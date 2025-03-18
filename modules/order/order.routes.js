const {PERMISSIONS} = require('../../common/constants/rollsAndPermissions.const');
const { guard } = require('../../middlewares/guard.middleware');
const { getOrdersHandler, orderStatusPayedHandler, progressOrderStatusHandler, cancelOrderStatusHandler } = require('./order.service');

const router = require('express').Router();

// Show all orders by filtering them
router.get('/', guard([PERMISSIONS.ORDER_VIEW,PERMISSIONS.PRODUCT_CREATE]), getOrdersHandler)

// router.patch('/pay/:id', guard(PERMISSIONS.ORDER_MANAGE), orderStatusPayedHandler)

router.patch('/progress/:id', guard(PERMISSIONS.ORDER_MANAGE), progressOrderStatusHandler)
router.patch('/inprogress/:id', guard([PERMISSIONS.ORDER_MANAGE]), progressOrderStatusHandler)
router.patch('/packet/:id', guard([PERMISSIONS.ORDER_MANAGE, PERMISSIONS.PACKET_MANAGE]), progressOrderStatusHandler)
router.patch('/shipping/:id', guard([PERMISSIONS.ORDER_MANAGE, PERMISSIONS.SHIPPING_MANAGE]), progressOrderStatusHandler)
router.patch('/delivered/:id', guard([PERMISSIONS.ORDER_MANAGE, PERMISSIONS.DELIVERY_MANAGE]), progressOrderStatusHandler)

router.patch('/cancel/:id', guard([PERMISSIONS.ORDER_MANAGE,PERMISSIONS.ORDER_CUSTOMER]), cancelOrderStatusHandler)

module.exports = {
    OrderRouter : router
}