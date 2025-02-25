const { DataTypes,UUIDV4 } = require("sequelize");
const sequelize = require("../../configs/sequelize.config");
const { PRODUCT_TYPE } = require("../../common/constants/product.const");

const Product = sequelize.define('product',{
    // id: {type: DataTypes.INTEGER, primaryKey:true, autoIncrement: true},
    id: {type: DataTypes.UUID, primaryKey:true, defaultValue: UUIDV4},
    title: {type: DataTypes.STRING, allowNull: false},
    price: {type: DataTypes.DECIMAL, allowNull: true},
    discount: {type: DataTypes.INTEGER, defaultValue:0, allowNull:true},
    discount_status: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true},
    type: {type: DataTypes.ENUM(...Object.values(PRODUCT_TYPE))},
    count: {type: DataTypes.INTEGER, defaultValue:0},
    description: {type: DataTypes.TEXT}
},{
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true
})

const ProductFeature = sequelize.define("product_feature",{
    id: {type: DataTypes.INTEGER, primaryKey:true, autoIncrement: true},
    key: {type: DataTypes.STRING},
    value: {type: DataTypes.STRING},
    product_id: {type: DataTypes.UUID}
},{
    freezeTableName: true,
    timestamps: false
})


const ProductColor = sequelize.define("product_color",{
    id: {type: DataTypes.INTEGER, primaryKey:true, autoIncrement: true},
    color_name: {type: DataTypes.STRING},
    color_code: {type: DataTypes.STRING},
    count: {type: DataTypes.INTEGER, defaultValue:0},
    price: {type: DataTypes.DECIMAL, defaultValue:0},
    discount: {type: DataTypes.INTEGER, defaultValue:0},
    discount_status: {type: DataTypes.BOOLEAN, defaultValue: false},
    product_id: {type: DataTypes.UUID}
},{
    freezeTableName: true,
    timestamps: false
})


const ProductSize = sequelize.define("product_size",{
    id: {type: DataTypes.INTEGER, primaryKey:true, autoIncrement: true},
    size: {type: DataTypes.STRING},
    count: {type: DataTypes.INTEGER, defaultValue:0},
    price: {type: DataTypes.DECIMAL, defaultValue:0},
    discount: {type: DataTypes.INTEGER, defaultValue:0},
    discount_status: {type: DataTypes.BOOLEAN, defaultValue: false},
    product_id: {type: DataTypes.UUID}
},{
    freezeTableName: true,
    timestamps: false
})

Product.hasMany(ProductFeature,{
    as: 'features',
    foreignKey: 'product_id',
    sourceKey: 'id',
});

Product.hasMany(ProductColor,{
    as: 'colors',
    foreignKey: 'product_id',
    sourceKey: 'id',
});

Product.hasMany(ProductSize,{
    as: 'sizes',
    foreignKey: 'product_id',
    sourceKey: 'id',
});

ProductFeature.belongsTo(Product,{foreignKey: 'product_id', targetKey: 'id'})
ProductColor.belongsTo(Product,{foreignKey: 'product_id', targetKey: 'id'})
ProductSize.belongsTo(Product,{foreignKey: 'product_id', targetKey: 'id'})


module.exports = {
    Product,
    ProductFeature,
    ProductColor,
    ProductSize
}