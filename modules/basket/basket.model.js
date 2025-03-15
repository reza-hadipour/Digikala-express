const { DataTypes, UUIDV4 } = require("sequelize");
const sequelize = require("../../configs/sequelize.config");
const { User } = require("../user/user.model");
const { ProductVariants, Product } = require("../product/product.model");

const Basket = sequelize.define('Basket', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true }, // Ensure one-to-one relationship
}, {
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true
});


const BasketProduct = sequelize.define('BasketProduct', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
    basket_id: { type: DataTypes.UUID, allowNull: true },
    product_id: { type: DataTypes.UUID, allowNull: true },
    variant_id: { type: DataTypes.INTEGER, allowNull: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 }
}, {
    freezeTableName: true,
    timestamps: true,
    indexes: [
        {
            fields: ['basket_id','product_id','variant_id'],
            unique: true
        }
    ]
});

// Relationships
Basket.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });

Basket.hasMany(BasketProduct,{ foreignKey: 'basket_id', sourceKey:'id', onDelete:'CASCADE' });
BasketProduct.belongsTo(Basket, { foreignKey: 'basket_id', targetKey: 'id'});

Product.hasMany(BasketProduct,{foreignKey:'product_id', onDelete: 'CASCADE'});
BasketProduct.belongsTo(Product,{foreignKey: 'product_id', targetKey:'id'});

ProductVariants.hasMany(BasketProduct,{foreignKey:'variant_id', onDelete: 'CASCADE'});
BasketProduct.belongsTo(ProductVariants,{foreignKey: 'variant_id', targetKey:'id'});

// Basket.sync({alter: true, force: true})
// BasketProduct.sync({force: true, alter: true})

module.exports = {
    Basket,
    BasketProduct
}
