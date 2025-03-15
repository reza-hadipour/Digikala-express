const { DataTypes, UUIDV4 } = require("sequelize");
const sequelize = require("../../configs/sequelize.config");

const Payment = sequelize.define('Payment',{
    id:{type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4()},
    order_id: {type: DataTypes.UUID, allowNull: true},
    authority: {type: DataTypes.STRING, allowNull: true},
    refId: {type: DataTypes.STRING, allowNull: true} ,
    amount: {type: DataTypes.INTEGER, allowNull: true},
    status: {type: DataTypes.BOOLEAN, defaultValue: false},
    basket_id: {type: DataTypes.UUID, allowNull: false}
},{
    freezeTableName: true
})


// Payment.sync({alter: true})

module.exports = {
    Payment
}