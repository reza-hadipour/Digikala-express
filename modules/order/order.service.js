const {getNextState,transition} =  require('../../services/fsm');
const { Op } = require("sequelize");
const { Order } = require("./order.model");
const ORDER_STATUS = require('../../common/constants/order.const');
const createHttpError = require('http-errors');
const { checkUserHasRole } = require('../user/user.service');


async function  getOrdersHandler(req,res,next) {
    try {
        const user = req.user;
        const {status, createDate} = req.query;

        let whereClause = {}
        if(status) whereClause['status'] = status
        if(createDate) whereClause['created_at'] = { [Op.gt] : createDate }

        userRole = await checkUserHasRole(user,"Customer");
        let orders = {};

        if(userRole){
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
        const order = await transitOrder(orderId,ORDER_STATUS.PAYED);
        return res.json({order});
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

async function getOrders(filter) {
    return await Order.findAll({where: filter})
}

async function getOrderById(orderId) {
    const order = await Order.findByPk(orderId);
    if(!order) throw createHttpError.NotFound('Order not found.')
    return order;
}

async function transitOrder(order,event) {
    const newStatus = transition(order.status,event);
    return await updateOrderStatus(order,newStatus)
}

async function progressOrder(order) {
    const nextState = getNextState(order.status);
    if(!nextState) throw createHttpError.NotAcceptable({
        message :`Order status is: ${order.status}, can not progress more.`,
        order
    })
    return await transitOrder(order,nextState)
}

async function updateOrderStatus(order, newStatus) {
    order.status = newStatus;
    await order.save();
    return order;
  }
  

module.exports = {
    getOrdersHandler,
    orderStatusPayedHandler,
    progressOrderStatusHandler
}