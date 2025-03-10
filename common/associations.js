const { Basket, BasketProduct } = require("../modules/basket/basket.model");
const { Order, OrderProduct } = require("../modules/order/order.model");
const { Payment } = require("../modules/payment/payment.model");
const { Product, ProductVariants } = require("../modules/product/product.model");


// BasketProduct
Product.hasMany(BasketProduct,{foreignKey:'product_id'});
BasketProduct.belongsTo(Product,{foreignKey:'product_id',targetKey:'id'})

ProductVariants.hasMany(BasketProduct,{foreignKey:'variant_id'});
BasketProduct.belongsTo(ProductVariants,{foreignKey:'variant_id',targetKey:'id'})


// OrderProduct
Product.hasMany(OrderProduct,{foreignKey: 'productId'})
OrderProduct.belongsTo(Product, { foreignKey: 'productId'});

ProductVariants.hasMany(OrderProduct,{ foreignKey: 'variantId'})
OrderProduct.belongsTo(ProductVariants, { foreignKey: 'variantId'});

Order.hasOne(Payment,{foreignKey: 'orderId', sourceKey:'id'});


// BasketProduct.sync({alter:true, force: false, logging:true})
// OrderProduct.sync({alter:true, force: false, logging:true})

