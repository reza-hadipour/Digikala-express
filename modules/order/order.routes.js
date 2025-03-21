const ORDER_STATUS = require('../../common/constants/order.const');
const {PERMISSIONS} = require('../../common/constants/rollsAndPermissions.const');
const { guard } = require('../../middlewares/guard.middleware');
const { getOrdersHandler, progressOrderStatusHandler, cancelOrderStatusHandler, orderStatusHandler } = require('./order.service');

const router = require('express').Router();

// Show all orders by filtering them
router.get('/', guard([PERMISSIONS.ORDER_VIEW,PERMISSIONS.PRODUCT_CREATE]), getOrdersHandler)

router.patch('/progress/:id', guard(PERMISSIONS.ORDER_MANAGE), progressOrderStatusHandler)

router.patch('/inProcess/:id', guard([PERMISSIONS.ORDER_MANAGE]), orderStatusHandler(ORDER_STATUS.IN_PROCESS));
router.patch('/packet/:id', guard([PERMISSIONS.ORDER_MANAGE, PERMISSIONS.PACKET_MANAGE]), orderStatusHandler(ORDER_STATUS.PACKET))
router.patch('/shipping/:id', guard([PERMISSIONS.ORDER_MANAGE, PERMISSIONS.SHIPPING_MANAGE]), orderStatusHandler(ORDER_STATUS.SHIPPING))
router.patch('/delivered/:id', guard([PERMISSIONS.ORDER_MANAGE, PERMISSIONS.DELIVERY_MANAGE]), orderStatusHandler(ORDER_STATUS.DELIVERED))

router.patch('/cancel/:id', guard([PERMISSIONS.ORDER_MANAGE,PERMISSIONS.ORDER_CUSTOMER]), cancelOrderStatusHandler)

module.exports = {
    OrderRouter : router
}