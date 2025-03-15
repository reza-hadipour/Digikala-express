const sequelize = require("../../configs/sequelize.config");
const { Order } = require("../order/order.model");

async function main(){
    const t = await sequelize.transaction();
    try {
        await A(t);
        await B(t);
    }
    catch(error){
        await t.rollback();
    }
}


async function A(transaction) {
    const t = await sequelize.transaction({transaction});
    try {
        const order = await Order.findOne({id: "41961795-37e6-4595-9413-a059e50aa5e2"});
        order.price = 100;
        await order.save({transaction:t});
        await t.commit();
    } catch (error) {
        await t.rollback();
    }
}


async function B(transaction) {
    const t = await sequelize.transaction({transaction});
    try {
        const order = await Order.findOne({id: "41961795-37e6-4595-9413-a059e50aa5e2"});
        order.price += 300;
        await order.save({transaction:t});
        await t.commit();
    } catch (error) {
        await t.rollback();
    }
}

main();