const { DataTypes, UUIDV4 } = require("sequelize")
const sequelize = require("../../configs/sequelize.config")
const { User } = require("../user/user.model")
const ORDER_STATUS = require("../../common/constants/order.const")
const { Product, ProductVariants } = require("../product/product.model")
const { Payment } = require("../payment/payment.model")

const Order = sequelize.define('Order',{
    id: {type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4()},
    user_id: {type: DataTypes.UUID, allowNull: false},
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
    order_id: {type: DataTypes.UUID, allowNull: false},
    product_id: {type: DataTypes.UUID, allowNull: true },
    variant_id: {type: DataTypes.INTEGER, allowNull: true},
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    },{
        freezeTableName:true,
        timestamps: false,
        indexes:[
            {
                fields: ['order_id','product_id','variant_id'],
                unique: true
            }
        ]
    });

// Define the relationships
User.hasMany(Order,{foreignKey: 'user_id',sourceKey: 'id'});

Order.hasOne(Payment,{foreignKey: 'order_id', sourceKey:'id', onDelete: 'CASCADE'});
Payment.belongsTo(Order,{foreignKey:'order_id'})

Order.hasMany(OrderProduct, { foreignKey: 'order_id' });
OrderProduct.belongsTo(Order, { foreignKey: 'order_id' });

OrderProduct.belongsTo(Product, { foreignKey: 'product_id' });
OrderProduct.belongsTo(ProductVariants, { foreignKey: 'variant_id' });


// Order.sync({alter: true, force: true});
// OrderProduct.sync({alter: true, force: true});

module.exports = {
    Order,
    OrderProduct
}