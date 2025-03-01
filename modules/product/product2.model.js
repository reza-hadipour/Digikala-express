const { DataTypes, UUIDV4 } = require('sequelize');
const sequelize = require('../../configs/sequelize.config');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
},{
    timestamps: false,
    freezeTableName: true
});

const CategoryFeatures = sequelize.define('CategoryFeatures', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Category,
      key: 'id',
    },
  },
  feature_key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
},{
    freezeTableName: true,
    timestamps: false
});

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: UUIDV4()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  discount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  discount_status:{
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Category,
      key: 'id',
    },
  },
},{
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true,
    freezeTableName: true
});

const ProductFeatures = sequelize.define('ProductFeatures', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.UUID,
    references: {
      model: Product,
      key: 'id',
    },
  },
  feature_key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  feature_value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const ProductVariants = sequelize.define('ProductVariants', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.UUID,
    references: {
      model: Product,
      key: 'id',
    },
  },
  variant_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
        isIn:[['color','size','color-size','other']]
    }
  },
  variant_value: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  discount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  discount_status: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Define associations
Category.hasMany(CategoryFeatures, { foreignKey: 'category_id' });
CategoryFeatures.belongsTo(Category, { foreignKey: 'category_id' });

Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Product.hasMany(ProductFeatures, { foreignKey: 'product_id' });
ProductFeatures.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductVariants, { foreignKey: 'product_id' });
ProductVariants.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  Category,
  CategoryFeatures,
  Product,
  ProductFeatures,
  ProductVariants,
};