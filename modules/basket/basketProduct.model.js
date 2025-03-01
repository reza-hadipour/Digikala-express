const { DataTypes, UUIDV4 } = require("sequelize");
const sequelize = require("../../configs/sequelize.config");
const Basket = require("./basket.model");
const { Product } = require("../product/product.model");

const BasketProduct = sequelize.define('basket_product', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
    basket_id: { type: DataTypes.UUID, allowNull: false },
    product_id: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    price: { type: DataTypes.DECIMAL, allowNull: false },
    discount: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_price: { type: DataTypes.DECIMAL, allowNull: false },
}, {
    freezeTableName: true,
    timestamps: true
});

// Relationships
BasketProduct.belongsTo(Basket, { foreignKey: 'basket_id', targetKey: 'id' });
BasketProduct.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'id' });

module.exports = BasketProduct;
