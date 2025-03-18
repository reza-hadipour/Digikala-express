const createHttpError = require("http-errors");
const { getBasketByUserId, getBasketItems, getBasketItemByBasketId } = require("../basket/basket.service");
const { Payment } = require("./payment.model");
const { Order, OrderProduct } = require("../order/order.model");
const ORDER_STATUS = require("../../common/constants/order.const");
const { Basket } = require("../basket/basket.model");
const { Product, ProductVariants } = require("../product/product.model");
const sequelize = require("../../configs/sequelize.config");
const { getPaymentLink, verifyTransaction } = require("../../services/zarinpal.service");
const { PRODUCT_TYPE } = require("../../common/constants/product.const");
const { transitOrder } = require("../order/order.service");

async function payment(req, res, next) {
    const t = await sequelize.transaction({ logging: false });
    try {
        // Get basket of user
        const userId = req.user.id;
        const basket = await getBasketByUserId(userId)
        if (!basket) throw createHttpError.NotFound("There is no basket to pay.")

        // calculate basket
        const basketItems = await getBasketItems(basket.id);
        const price = basketItems['totalPrice'];
        const discount = basketItems['totalDiscount'];
        const amount = basketItems['totalPriceAfterDiscount'];

        // Get pay url
        const paymentRequest = await getPaymentLink(amount);

        if (paymentRequest.code === 100) {
            // Check payment with basketId,
            // if payment then destroy payment, order, orderProducts
            await checkDuplicatePayments(basket.id, t)

            // Create Payment
            const payment = await createPayment({
                authority: paymentRequest.authority,
                amount,
                basketId: basket.id
            }, t);

            // Create Order
            const order = await Order.create({
                user_id: userId,
                payment_id: payment.id,
                price,
                discount,
                amount,
                status: ORDER_STATUS.PENDING
            }, { transaction: t })

            const orderId = order.id

            // items will be added to order in verify section, due if user cancel the payment the order and payment will be removed.
            // add items to order
            await updateProductQuantityAndCreateOrderProducts(orderId, basket.id, t)

            // Save Payment
            payment.order_id = orderId;
            await payment.save({ transaction: t })

            await t.commit();

            // Send pay request
            // return res.redirect(payUrl);
            return res.json({
                "payment_url": paymentRequest.paymentUrl
            })

        } else {
            return res.json({
                message: paymentRequest?.message ?? paymentRequest?.error.message,
                errors: paymentRequest?.error
            })
        }
    } catch (error) {
        await t.rollback()
        next(error);
    }

}

async function verify(req, res, next) {
    const t = await sequelize.transaction({ logging: false })
    try {
        const { Status = "NOK", Authority = undefined } = req.query;
        console.log(req.query);
        if (Status === "OK" && Authority) {
            // Pay successfully
            // search Payment by authority and check status
            // Check payment authority to prevent duplicate payment
            const payment = await getPayment(Authority, t);
            // if (payment.status == true) throw createHttpError.Conflict("Payment is already payed.")

            // Verify payment
            const verificationResult = await verifyTransaction(Authority, payment.amount)
            const { code, ref_id, card_pan, message, fee } = verificationResult;

            if (code === 100 && ref_id) {
                const order = await updateOrderStatusByPaymentId(payment.id, t);

                // update payment refId, status
                payment['refId'] = ref_id;
                payment['status'] = true;
                await payment.save({ transaction: t });

                // cascade delete
                // await basket.destroy({transaction: t});
                const userId = order.user_id;
                await destroyBasket(userId, t);

                await t.commit();

                return res.json({
                    message: `System: ${message},Order paid successfully`,
                    orderId: order.id,
                    referenceId: ref_id,
                    card_pan,
                    fee,
                })

            } else if (code === 101) {
                return res.json({
                    message: `System: ${message},This transaction is already verified`,
                    ref_id,
                    code,
                    fee
                })
            } else {
                return res.json({
                    message,
                    code,
                    errors: verificationResult?.errors
                })
            }
        } else {
            // Pay failed
            // remove payment and order if user cancel the payment
            // search Payment by authority and check status
            const payment = await getPayment(Authority, t);

            if (payment.status === true) {
                return res.json({
                    message: "Payment is already verified.",
                })
            }

            const orderId = payment.order_id;

            await updateProductQuantityToRemoveOrderProducts(orderId, t);
            // payment deleted using cascading
            // await payment.destroy({transaction: t});
            await Order.destroy({ where: { id: orderId }, transaction: t })

            await t.commit();

            return res.json({
                message: "Payment failed. Order,payment and all orderItems are removed."
            })
        }
    } catch (error) {
        await t.rollback();
        next(error);
    }
}

async function createPayment(paymentDto, transaction) {
    const { authority, amount, basketId: basket_id } = paymentDto;
    const t = await sequelize.transaction({ transaction, logging: false });
    try {
        payment = await Payment.create({
            authority,
            amount,
            basket_id
        }, { transaction: t });

        await t.commit();
        return payment;
    } catch (error) {
        await t.rollback();
        debugDb('createPayment fn rolled back due to error:', error);
        throw new Error(error, { cause: 'createPayment' })
    }
}

async function destroyBasket(userId, transaction) {
    const t = await sequelize.transaction({ transaction });
    try {
        // Destroy Basket and BasketProduct in cascade
        await Basket.destroy({ where: { user_id: userId } }, { transaction: t });
        await t.commit();

    } catch (error) {
        await t.rollback();
        debugDb('destroyBasket fn rolled back due to error:', error);
        throw new Error(error, { cause: 'destroyBasket' })
    }
}

async function checkDuplicatePayments(basket_id, transaction) {
    const t = await sequelize.transaction({ transaction });

    try {
        let payment = await Payment.findOne({ where: { basket_id }, transaction: t })

        // Destroy payment,order and orderProducts
        if (payment) {
            const orderId = payment.order_id;
            // Update Stock quantity before deleting orderProducts
            await updateProductQuantityToRemoveOrderProducts(orderId, t)
            // Cascading Delete Payment, orderProducts
            await Order.destroy({ where: { id: orderId }, transaction: t })
            // await payment.destroy({transaction: t});
        }
        await t.commit();
    } catch (error) {
        await t.rollback();
        debugDb('checkDuplicatePayments fn rolled back due to error:', error);
        throw new Error(error, { cause: 'checkDuplicatePayments' })
    }
}

async function updateProductQuantityToRemoveOrderProducts(orderId, transaction) {
    const t = await sequelize.transaction({ transaction });
    try {
        const orderItems = await OrderProduct.findAll({
            where: { 'order_id': orderId },
            include: [
                { model: Product },
                { model: ProductVariants }
            ],
            transaction: t
        })

        for (const item of orderItems) {
            const itemType = (item.ProductVariant) ? PRODUCT_TYPE.variant : PRODUCT_TYPE.product;
            const quantity = item.quantity;
            // back the amount of quantity in basket to the product count
            item[itemType].count += quantity;
            await item[itemType].save({ transaction: t });
            // item => orderProduct that can be deleted by deleting order
            // await item.destroy({transaction: t});
        }
        await t.commit();
    } catch (error) {
        await t.rollback();
        debugDb('destroyAndRestoreOrderProducts fn rolled back due to error:', error);
        throw new Error(error, { cause: 'destroyAndRestoreOrderProducts' })
    }

}

async function updateProductQuantityAndCreateOrderProducts(orderId, basketId, transaction) {
    const t = await sequelize.transaction({ transaction });
    try {
        let orderItems = [];
        const basketProducts = await getBasketItemByBasketId(basketId, t);
        for (const item of basketProducts) {
            const quantity = item.quantity;

            const orderItemData = {
                order_id: orderId,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity
            }

            // update product/variants quantity
            const itemType = item.ProductVariant ? PRODUCT_TYPE.variant : PRODUCT_TYPE.product;

            item[itemType].count -= quantity;
            await item[itemType].save({ transaction: t });

            orderItems.push(orderItemData);
        }

        // await OrderProduct.bulkCreate(orderItems,{transaction: t})
        await createOrderProduct(orderItems, t);
        await t.commit();

    } catch (error) {
        await t.rollback();
        debugDb('destroyAndRestoreOrderProducts fn rolled back due to error:', error);
        throw new Error(error, { cause: 'destroyAndRestoreOrderProducts' })
    }
}

async function createOrderProduct(products, transaction) {
    const t = await sequelize.transaction({ transaction });
    try {
        await OrderProduct.bulkCreate(products, { transaction: t })
        await t.commit();
    } catch (error) {
        await t.rollback()
        debugDb('createOrderProduct fn rolled back due to error:', error);
        throw new Error(error, { cause: 'createOrderProduct' })
    }
}

async function getPayment(Authority, transaction) {
    const t = await sequelize.transaction({ transaction })
    try {
        const payment = await Payment.findOne({ where: { 'authority': Authority }, transaction: t });
        if (!payment) throw createHttpError.NotFound("Payment not found");
        await t.commit();
        return payment
    } catch (error) {
        await t.rollback();
        debugDb('getPayment fn rolled back due to error:', error);
        throw new Error(error, { cause: 'getPayment' })
    }
}

async function updateOrderStatusByPaymentId(paymentId, transaction) {
    const t = await sequelize.transaction({ transaction });

    try {
        const order = await Order.findOne({
            include: {
                model: Payment, where: { id: paymentId }
            }
        });
        if (!order) throw createHttpError.NotAcceptable("Related order not found.")

        //update order status to paid
        const updatedOrder =  await transitOrder(order,ORDER_STATUS.PAYED, t);
        // order.status = ORDER_STATUS.PAYED;
        // await order.save({ transaction: t });
        await t.commit();
        return updatedOrder;
    } catch (error) {
        await t.rollback();
        debugDb('updateOrderStatusByPaymentId fn rolled back due to error:', error);
        throw new Error(error, { cause: 'updateOrderStatusByPaymentId' })
    }

}

module.exports = {
    payment,
    verify,
}
