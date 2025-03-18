const {getNextState,transition} =  require('../../services/fsm');
const { Op } = require("sequelize");
const { Order } = require("./order.model");
const ORDER_STATUS = require('../../common/constants/order.const');
const createHttpError = require('http-errors');
const { checkUserHasRole } = require('../user/user.service');
const { ROLES } = require('../../common/constants/rollsAndPermissions.const');
const sequelize = require('../../configs/sequelize.config');


async function  getOrdersHandler(req,res,next) {
    try {
        const user = req.user;
        
        const {status, createDate} = req.query;

        let whereClause = {}
        if(status) whereClause['status'] = status
        if(createDate) whereClause['created_at'] = { [Op.gt] : createDate }

        let orders = {};

        const isCustomer = await checkUserHasRole(user,ROLES.CUSTOMER);
        
        if(isCustomer){
            whereClause['user_id'] = req.user.id;
            orders = await getOrders(whereClause);
        }else{
            orders = await getOrders(whereClause);
        }

        return res.json(orders)

    } catch (error) {
        next(error)
    }
}

async function orderStatusPayedHandler(req,res,next) {
    try {
        const orderId = req.params.id;
        const order = await getOrderById(orderId)
        const updatedOrder = await transitOrder(order,ORDER_STATUS.PAYED);
        return res.json({updatedOrder});
    } catch (error) {
        next(error)
    }
}

async function progressOrderStatusHandler(req,res,next) {
    try {
        const orderId = req.params.id;
        const order = await getOrderById(orderId)
        const updatedOrder = await progressOrder(order);
        return res.json({order: updatedOrder});
    } catch (error) {
        next(error)
    }
}

async function cancelOrderStatusHandler(req,res,next) {
    try {
        const orderId = req.params.id;
        const order = await getOrderById(orderId)
        const updatedOrder = await transitOrder(order,ORDER_STATUS.CANCELED);
        return res.json({order: updatedOrder});
    } catch (error) {
        next(error)
    }
}

async function getOrders(filter) {
    return await Order.findAll({where: filter})
}

async function getOrderById(orderId) {
    const order = await Order.findByPk(orderId);
    if(!order) throw createHttpError.NotFound('Order not found.')
    return order;
}

async function transitOrder(order,event, transaction = undefined) {
    const t = await sequelize.transaction({transaction});
    try {
        const newStatus = transition(order.status,event);
        return await updateOrderStatus(order,newStatus,t)
    } catch (error) {
        await t.rollback();
        debugDb('transitOrder fn rolled back due to error:', error);
        throw new Error(error, { cause: 'transitOrder' })
    }
}

async function progressOrder(order) {
    const nextState = getNextState(order.status);
    if(!nextState) throw createHttpError.NotAcceptable({
        message :`Order status is: ${order.status}, can not progress more.`,
        order
    })
    return await transitOrder(order,nextState)
}

async function updateOrderStatus(order, newStatus, transaction= undefined) {
    const t = await sequelize.transaction({transaction});
    try {
        order.status = newStatus;
        await order.save();
        await t.commit();
        return order;
    } catch (error) {
        await t.rollback();
        debugDb('updateOrderStatus fn rolled back due to error:', error);
        throw new Error(error, { cause: 'updateOrderStatus' })
    }
  }
  

module.exports = {
    getOrdersHandler,
    orderStatusPayedHandler,
    progressOrderStatusHandler,
    cancelOrderStatusHandler,
    transitOrder
}