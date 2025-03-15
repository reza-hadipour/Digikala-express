const { DataTypes, UUIDV4 } = require('sequelize');
const sequelize = require('../../configs/sequelize.config');
const { PRODUCT_VARIANT } = require("../../common/constants/product.const");

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  price: {
    type: DataTypes.INTEGER,
  },
  discount: {
    type: DataTypes.INTEGER,
  },
  discount_status:{
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
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
  },
  feature_value: {
    type: DataTypes.STRING,
  },
},{
  timestamps: false,
  freezeTableName: true
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
    type: DataTypes.ENUM(...Object.values(PRODUCT_VARIANT)),
    allowNull: false,
    validate:{
        isIn:[['color','size','color-size','other']]
    }
  },
  variant_value: {
    type: DataTypes.JSON
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  discount: {
    type: DataTypes.INTEGER,
  },
  discount_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
},{
  createdAt: "create_at",
  updatedAt: "updated_at",
  freezeTableName: true,
  timestamps: true
});

// Define associations
Category.hasMany(CategoryFeatures, { foreignKey: 'category_id' , as: "features"});
CategoryFeatures.belongsTo(Category, { foreignKey: 'category_id' });

Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Product.hasMany(ProductVariants, { foreignKey: 'product_id', as: 'variants'});
ProductVariants.belongsTo(Product, { foreignKey: 'product_id', as: 'products' });

Product.hasMany(ProductFeatures, { foreignKey: 'product_id', as: 'features' });
ProductFeatures.belongsTo(Product, { foreignKey: 'product_id' });

// Category.sync({alter:true})
// CategoryFeatures.sync({alter:false})
// Product.sync({alter:true})
// ProductFeatures.sync({alter:false})
// ProductVariants.sync({alter:true})


module.exports = {
  Category,
  CategoryFeatures,
  Product,
  ProductFeatures,
  ProductVariants,
};
