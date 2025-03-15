const { Basket, BasketProduct } = require("../modules/basket/basket.model");
const { Order, OrderProduct } = require("../modules/order/order.model");
const { Payment } = require("../modules/payment/payment.model");
const { Product, ProductVariants } = require("../modules/product/product.model");


// OrderProduct
// Product.hasMany(OrderProduct,{foreignKey: 'product_id'})
// OrderProduct.belongsTo(Product, { foreignKey: 'product_id'});

// ProductVariants.hasMany(OrderProduct,{ foreignKey: 'variant_id'})
// OrderProduct.belongsTo(ProductVariants, { foreignKey: 'variant_id'});



// BasketProduct.sync({alter:true, force: false, logging:true})
// OrderProduct.sync({alter:true, force: false, logging:true})

