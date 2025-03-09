const { DataTypes, UUIDV4 } = require("sequelize")
const sequelize = require("../../configs/sequelize.config")
const { User } = require("../user/user.model")
const { Payment } = require("../payment/payment.model")
const { Product, ProductVariants } = require("../product/product.model")

const Order = sequelize.define('Order',{
    id: {type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4()},
    userId: {type: DataTypes.UUID, allowNull: false},
    paymentId: {type: DataTypes.UUID, allowNull: true},
    price: {type: DataTypes.INTEGER, defaultValue:0, allowNull: true},
    discount: {type: DataTypes.INTEGER, defaultValue:0, allowNull: true},
    amount: {type: DataTypes.INTEGER, defaultValue:0 },
    status: {type: DataTypes.STRING, defaultValue: 'pending'},
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

OrderProduct.belongsTo(Product, { foreignKey: 'productId', targetKey: 'id' });
OrderProduct.belongsTo(ProductVariants, { foreignKey: 'variantId', targetKey: 'id' });

// Order.hasOne(Payment,{foreignKey: 'paymentId', sourceKey: 'id'});
Payment.belongsTo(Order,{foreignKey: 'orderId', targetKey: 'id'});


// Order.sync({alter: true});
// OrderProduct.sync({alter: true});

module.exports = {
    Order,
    OrderProduct
}