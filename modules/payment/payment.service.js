const createHttpError = require("http-errors");
const { getBasketByUserId, getBasketItems, getBasketItemByBasketId } = require("../basket/basket.service");
const { Payment } = require("./payment.model");
const { Order, OrderProduct } = require("../order/order.model");
const ORDER_STATUS = require("../../common/constants/order.const");
const { BasketProduct, Basket } = require("../basket/basket.model");
const { Product, ProductVariants } = require("../product/product.model");
const sequelize = require("../../configs/sequelize.config");

async function payment(req,res,next) {
    const t = await sequelize.transaction({logging: true});
    try {
        // Get basket of user
        const userId = req.user.id;
        const basket = await getBasketByUserId(userId)
        if(!basket) throw createHttpError.NotFound("There is no basket to pay.")

        // calculate basket
        const basketItems = await getBasketItems(basket.id);
        const price = basketItems['totalPrice'];
        const discount = basketItems['totalDiscount'];
        const amount = basketItems['totalPriceAfterDiscount'];

        const payDetail = {
            "merchant_id": process.env.ZARINPAL_MERCHANT_ID,
            amount,
            description: `Buy from ${process.env.APP_NAME}`,
            callback_url: `http://localhost:${process.env.APP_PORT}/pay/verify`
        }

        // Get pay url
        const payReqUrl = process.env.ZARINPAL_REQUEST_URL;
        const response = await fetch(payReqUrl,{
            method: 'post',
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(payDetail)
        })
        let zarinpalRequest = await response.json()
        
        // console.log(zarinpalRequest);

        if(zarinpalRequest.data.code === 100){
        
            // Check payment with basketId,
            
            // if payment then destroy payment, order, orderProducts
            let payment = await Payment.findOne({where:{basketId:basket.id},transaction: t})

            // Destroy payment,order and orderProducts
            if(payment){
                const orderId = payment.orderId;
                 
                // restore stoke quantity 
                // Update Stock quantity before deleting orderProducts

                const orderItems = await OrderProduct.findAll({where:{orderId},
                    transaction:t,
                    include:[
                        {model: Product},
                        {model: ProductVariants}
                    ]})
                    for (const item of orderItems) {
                        const quantity = item.quantity;
                        const itemType = (item.ProductVariant) ? 'ProductVariant' : 'Product';
                        item[itemType].count += quantity;
                        await item[itemType].save();
                        await item.destroy();
                    }
                
                await Order.destroy({where:{id: orderId}, transaction:t})
                await payment.destroy({transaction: t});
            }

            // Create Payment
                payment = await Payment.create({
                    authority: zarinpalRequest.data.authority,
                    amount,
                    basketId: basket.id
                },{transaction: t})
                // Create Order
                const order = await Order.create({
                    userId,
                    paymentId: payment.id,
                    price,
                    discount,
                    amount,
                    status: ORDER_STATUS.PENDING
                },{transaction:t})

                // add items to order
                let orderItems = [];
                const basketProducts = await getBasketItemByBasketId(basket.id);
                for (const item of basketProducts) {
                    const orderItemData = {
                        orderId: order.id,
                        productId: item.product_id,
                        variantId: item.variant_id,
                        quantity: item.quantity
                    }

                    // update product / variants quantity
                    const itemType = item.ProductVariant ? 'ProductVariant' : 'Product';

                    item[itemType].count -=  item.quantity;
                    await item[itemType].save({transaction: t});

                    orderItems.push(orderItemData);
                }

                // I will add items to order in verify section, due if user cancel the payment, the order and payment will remove,
                await OrderProduct.bulkCreate(orderItems,{transaction:t})

                // Save Payment
                payment.orderId = order.id;
                await payment.save({transaction: t})

                await t.commit();
                

            // Send pay request
            const payUrl = process.env.ZARINPAL_PAY_URL + "/" + zarinpalRequest.data.authority;
            // return res.redirect(payUrl);
            return res.json({
                "payment_url": payUrl
            })
        } else {
            return res.json({
                message: "Failed to get payment url",
                errors: zarinpalRequest?.errors
            })
        }
    } catch (error) {
        await t.rollback()
        next(error);
    }   
}

async function verify(req,res,next) {
    const t =  await sequelize.transaction({logging:true})

    try {
        const {Status = "NOK",Authority = undefined} = req.query;
        console.log(req.query);
        console.log('Status',Status);
        if(Status === "OK" && Authority){
            //Pay successfully

            // search Payment by authority and check status
            const payment = await Payment.findOne({where:{'authority': Authority}});
            if(!payment) throw createHttpError.NotFound("Payment not found");

            // CHeck payment authority to prevent duplicate payment
            if(payment.status == true) throw createHttpError.Conflict("Payment is already payed.")

            // Verify payment
            // merchant_id, amount, authority

            const verificationBody = {
                merchant_id: process.env.ZARINPAL_MERCHANT_ID,
                amount: payment.amount,
                authority: Authority
            }

            const response = await fetch(process.env.ZARINPAL_VERIFY_URL,{
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(verificationBody),
            });

            const verificationResult = await response.json();
            
            const {code,ref_id, card_pan, message, fee} =  verificationResult.data;
            console.log(verificationResult);
            
            if(code === 100 && ref_id){
                // const order = await Order.findOne({where:{paymentId: payment.id}});
                const order = await Order.findOne({include:{
                    model: Payment, where: {id: payment.id}
                }});

                if(!order) throw createHttpError.NotAcceptable("Related order not found.")
                
                console.log(order);
                throw createHttpError.Conflict("Order is already paid");
                
                const userId = order.userId;

                //update order status to paid
                order.status = ORDER_STATUS.PAYED;
                await order.save();

                // update payment refId, status
                payment.refId = ref_id;
                payment.status = true;
                await payment.save();


                // Destroy Basket and BasketProduct where basketId = basket.id
                const basket = await Basket.findOne({where:{user_id: userId}});
                await BasketProduct.destroy({where:{basket_id: basket.id}});
                await basket.destroy();

                await t.commit();

                // calculate order and orderItems

                return res.json({
                    // send order to user
                    message: "Order payed successfully",
                    orderId: order.id,
                    referenceId: ref_id,
                    card_pan
                })
            }else if(code === 101){
                return res.json({
                    message: "This transaction is already verified",
                    ref_id,
                    code,
                    fee
                })
            }else{
                return res.json({
                    message,
                    errorCode: code,
                    errors: verificationResult?.errors
                })
            }
            
        }else{
            // Pay failed
            // remove payment and order if user cancel the payment
            // search Payment by authority and check status
            const payment = await Payment.findOne({where:{'authority': Authority}});
            if(payment.status === true){
                return res.json({
                    message: "Payment is already verified.",
                })
            }

            if(!payment) throw createHttpError.NotFound("Payment not found");

            const orderId = payment.orderId;
            // restore stoke quantity 
            const orderItems = await OrderProduct.findAll({where:{orderId},
                include:[
                    {model: Product},
                    {model: ProductVariants}
                ]})
                for (const item of orderItems) {
                    const quantity = item.quantity;
                    const itemType = (item.ProductVariant) ? 'ProductVariant' : 'Product';
                    item[itemType].count += quantity;
                    await item[itemType].save({transaction: t});
                    await item.destroy({transaction: t});
                }
            
            await Order.destroy({where:{id: orderId},transaction: t})
            await payment.destroy({transaction: t});
            
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

module.exports = {
    payment,
    verify
}