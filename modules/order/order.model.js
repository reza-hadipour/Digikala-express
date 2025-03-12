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


   
// Order.hasMany(OrderProduct,{foreignKey: 'order_id', sourceKey: 'id'});
// OrderProduct.belongsTo(Order,{foreignKey: 'order_id', targetKey: 'id'});

User.hasMany(Order,{foreignKey: 'user_id',sourceKey: 'id'});


Order.hasOne(Payment,{foreignKey: 'order_id', sourceKey:'id'});
Payment.belongsTo(Order,{foreignKey:'order_id'})


// OrderProduct
// Product.hasMany(OrderProduct,{foreignKey: 'product_id'})
// OrderProduct.belongsToMany(Product, { foreignKey: 'product_id'});

// ProductVariants.hasMany(OrderProduct,{ foreignKey: 'variant_id'})
// OrderProduct.belongsToMany(ProductVariants, { foreignKey: 'variant_id'});


// AI

// Define the relationships
// Order.belongsToMany(Product, { through: OrderProduct, foreignKey: 'order_id', otherKey:'product_id'});
// Product.belongsToMany(Order, { through: OrderProduct, foreignKey: 'product_id', otherKey:'order_id' });

// Order.belongsToMany(ProductVariants, { through: OrderProduct, foreignKey: 'order_id', otherKey: 'variant_id' });
// ProductVariants.belongsToMany(Order, { through: OrderProduct, foreignKey: 'variant_id', otherKey: 'order_id' });

Order.hasMany(OrderProduct, { foreignKey: 'order_id' });
OrderProduct.belongsTo(Order, { foreignKey: 'order_id' });

// Product.hasMany(OrderProduct, { foreignKey: 'product_id' });
OrderProduct.belongsTo(Product, { foreignKey: 'product_id' });

// ProductVariants.hasMany(OrderProduct, { foreignKey: 'variant_id' });
OrderProduct.belongsTo(ProductVariants, { foreignKey: 'variant_id' });



// Product.belongsToMany(Order,{through: OrderProduct, foreignKey: 'product_id',otherKey: 'order_id'})
// Order.belongsToMany(Product,{ through: OrderProduct, foreignKey: 'order_id', otherKey: 'product_id'})

// ProductVariants.belongsToMany(Order, {through: OrderProduct, foreignKey: 'variant_id', otherKey: 'order_id'})
// Order.belongsToMany(ProductVariants,{ through: OrderProduct, foreignKey: 'order_id', otherKey: 'variant_id'})

// Order.sync({alter: true, force: true});
// OrderProduct.sync({alter: true, force: true});

module.exports = {
    Order,
    OrderProduct
}