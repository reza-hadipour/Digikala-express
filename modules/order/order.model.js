const { DataTypes, UUIDV4 } = require("sequelize")
const sequelize = require("../../configs/sequelize.config")
const { User } = require("../user/user.model")
const ORDER_STATUS = require("../../common/constants/order.const")

const Order = sequelize.define('Order',{
    id: {type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4()},
    userId: {type: DataTypes.UUID, allowNull: false},
    // paymentId: {type: DataTypes.UUID, allowNull: true},
    price: {type: DataTypes.INTEGER, defaultValue:0, allowNull: true},
    discount: {type: DataTypes.INTEGER, defaultValue:0, allowNull: true},
    amount: {type: DataTypes.INTEGER, defaultValue:0 },
    status: {type: DataTypes.ENUM([...Object.values(ORDER_STATUS)]), defaultValue: ORDER_STATUS.PENDING},
},{
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})

const OrderProduct = sequelize.define('OrderProduct', {
    id: {type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4()},
    orderId: {type: DataTypes.UUID, allowNull: false},
    productId: {type: DataTypes.UUID, allowNull: true },
    variantId: {type: DataTypes.INTEGER, allowNull: true},
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    },{
        freezeTableName:true,
        timestamps: false
    });


   
Order.hasMany(OrderProduct,{foreignKey: 'orderId', sourceKey: 'id'});
OrderProduct.belongsTo(Order,{foreignKey: 'orderId', targetKey: 'id'});

User.hasMany(Order,{foreignKey: 'userId',sourceKey: 'id'});


// Order.sync({alter: true});
// OrderProduct.sync({alter: true});

module.exports = {
    Order,
    OrderProduct
}