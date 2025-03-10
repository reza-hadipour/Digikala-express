const { DataTypes, UUIDV4 } = require("sequelize");
const sequelize = require("../../configs/sequelize.config");
const { User } = require("../user/user.model");
const { ProductVariants, Product } = require("../product/product.model");

const Basket = sequelize.define('basket', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true }, // Ensure one-to-one relationship
}, {
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true
});

// Relationships
Basket.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' }); // One-to-one relationship


const BasketProduct = sequelize.define('basket_product', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
    basket_id: { type: DataTypes.UUID, allowNull: true },
    product_id: { type: DataTypes.UUID, allowNull: true },
    variant_id: { type: DataTypes.INTEGER, allowNull: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 }
}, {
    freezeTableName: true,
    timestamps: true
});

// Relationships
BasketProduct.belongsTo(Basket, { foreignKey: 'basket_id'});
BasketProduct.belongsTo(Product, { foreignKey: 'product_id'});
BasketProduct.belongsTo(ProductVariants, { foreignKey: 'variant_id'});

// Basket.sync({alter: true, force: true})
BasketProduct.sync({force: true})


module.exports = {
    Basket,
    BasketProduct
}
