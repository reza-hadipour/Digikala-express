const { Basket, BasketProduct } = require('./basket.model');
const { Product, ProductVariants } = require('../product/product.model');
const createHttpError = require('http-errors');
const { Op } = require('sequelize');
const { PRODUCT_TYPE } = require('../../common/constants/product.const');

async function addProductToBasket (req,res,next){
    try {
        const userId = req.user.id

        const {productId,variantId = undefined, quantity = 1} = req.body;

        // Check basket
        let basket = await Basket.findOne({where:{"user_id": userId}});

        if(!basket){
            basket = await Basket.create({
                user_id: userId
            });
        }

        const basketId = basket.id

        // Check Product and Variant exists
        let variantFilter = {}
        if(variantId) {
            variantFilter['id'] = variantId;
            // variantFilter['count'] = {[Op.gte]: quantity}
        }

        const product = await Product.findOne( {where:{
            id: productId,
        },
        include: variantId ? [
            {  model: ProductVariants,
                as: 'variants',
                required: true,
                where: variantFilter,
                attributes: ['id','variant_type', 'variant_value', 'count', 'price', 'discount', 'discount_status'],
             }
        ] : [] });


        if(!product) throw new createHttpError.NotFound("Product not found");

        if(!variantId && !product.price)  throw new createHttpError.BadRequest("Product has variants, select one to add to basket");

        
        // Check product in basket and increase the amount of the product

        let productInBasketFilter = {
            basket_id : basketId,
            product_id : productId,
        }
        if(variantId) productInBasketFilter['variant_id'] = variantId;

        let productInBasketData = {
            basket_id: basketId,
            product_id: productId,
            variant_id: variantId,
        };
        
        // Product details
        const count = variantId ? product.variants[0].count : product.count;
        // const price = variantId ? product.variants[0].price : product.price;
        // const discount = variantId ? product.variants[0].discount : product.discount;
        // const discount_status = variantId ? product.variants[0].discount_status : product.discount_status

        const productInBasket = await BasketProduct.findOne({where:productInBasketFilter})
        if(productInBasket) {
            // Duplicate Product
            
            // productInBasketData = {
                // discount:0
            // };

            const {quantity: quantityInBasket } = productInBasket

            if(count < (+quantity + quantityInBasket)) throw new createHttpError.NotAcceptable("There is not enough stock for this product");
            
            productInBasketData['quantity'] = +quantity + quantityInBasket
            // productInBasketData['price'] = Number(+priceInBasket + (+price * quantity))
            
            // if(discount_status) {
            //     productInBasketData['discount'] = Number(+discountInBasket + (((price * discount) / 100) * quantity))
            // }
                    
            // productInBasketData['total_price'] =  Number(productInBasketData['price'] - productInBasketData['discount'])

            await productInBasket.update({'quantity': productInBasketData['quantity']})
            // return res.json({
            //     productInBasketData,
            //     result,
            //     product
            // });

            
        }else{
            // Check count of product
            if(count < quantity) throw new createHttpError.NotAcceptable("There is not enough stock for this product");
    
            productInBasketData['quantity'] = +quantity
            // productInBasketData['price'] =  Number(price * quantity)
            
            // if(discount_status) {
            //     productInBasketData['discount'] = ((price * discount) / 100) * quantity
            // }
                    
            // productInBasketData['total_price'] =  Number(productInBasketData['price'] - productInBasketData['discount'])

            await BasketProduct.create(productInBasketData);

        }



        // this must applied after paying
        // if(variantId){
        //     product.variants[0].count -= quantity; // Update the count
        //     await product.variants[0].save(); // Save the changes
        // }else{
        //     product.count -= quantity; // Update the count
        //     await product.save(); // Save the changes
        // }



        return res.json({
            productInBasketData,
            product
        });
        
        
    } catch (error) {
        next(error)
    }
}

async function getProductInBasket(req,res,next) {
    try {
        // Get userid
        const userId = req.user.id;;

        // Get BasketID
        const basket = await Basket.findOne({where:{user_id:userId}})
        if(!basket) return res.json({
            products:[],
            totalPrice: 0
        })

        const basketId = basket.id;

        // Get Products & Variants in BasketProduct
        const basketItems = await getBasketItems(basketId);

        return res.json(basketItems);

        
    } catch (error) {
        next(error)
    }
}

async function getBasketItems(basketId) {
        const basketProducts = await BasketProduct.findAll({
            where:{basket_id: basketId},
            include: [
                {model: Product},{model: ProductVariants}
            ],
            order: [['updatedAt','ASC']]});

            if(!basketProducts) {
                return {
                    countOfProducts: 0,
                    totalPrice: 0,
                    totalDiscount: 0,
                    totalPriceAfterDiscount: 0,
                    products: []
                }
            }
            
            let BasketItems = [];

            let total_price = 0;
            let total_discount = 0;
            let total_price_after_discount = 0;

            for (const productInBasket of basketProducts) {
                const productDetail = {
                    message: "",
                    removedFromBasket: false
                };

                let quantity = productInBasket.quantity;
                let productPrice = 0;
                let productDiscount = 0;
                let productDiscountStatus = false;

                // Check product count in stock
                // if quantity is more than stock then set quantity to stock

                if(productInBasket.ProductVariant){
                    //Variants
                    if(productInBasket.quantity > productInBasket.ProductVariant.count && productInBasket.ProductVariant.count != 0){
                        quantity = productInBasket.quantity = productInBasket.ProductVariant.count;
                        await productInBasket.save();
                        productDetail['message'] = `Quantity of this product is changed to ${quantity}` ;
                    } else if( productInBasket.ProductVariant.count == 0){
                        // if productInBasket count is 0 then remove from basketProduct
                        await productInBasket.destroy();
                        productDetail['removedFromBasket'] = true
                        productDetail['message'] = `This product is removed from basket, there is no product in store.` ;
                    }

                    // Get Variant price, discount and discountStatus
                    productPrice = Number(productInBasket.ProductVariant.price)
                    productDiscount = Number(productInBasket.ProductVariant.discount)
                    productDiscountStatus = productInBasket.ProductVariant.discount_status

                }else{
                    // Single Product
                    if(productInBasket.quantity > productInBasket.Product.count && productInBasket.Product.count != 0){
                        quantity = productInBasket.quantity = productInBasket.Product.count;
                        // productInBasket.quantity = productCount;
                        await productInBasket.save();
                        productDetail['message'] = `Quantity of this product is changed to ${quantity}` ;
                    }else if( productInBasket.Product.count == 0){
                        // if productInBasket count is 0 then remove from basketProduct
                        await productInBasket.destroy();
                        productDetail['removedFromBasket'] = true
                        productDetail['message'] = `This product is removed from basket, there is no product in store.` ;
                    }

                    // Get Product price, discount and discountStatus
                    productPrice = Number(productInBasket.Product.price)
                    productDiscount = Number(productInBasket.Product.discount)
                    productDiscountStatus = productInBasket.Product.discount_status
                }

                productDetail['name'] = productInBasket.Product.title
    
                if(productInBasket.ProductVariant){
                    switch (productInBasket.ProductVariant.variant_type) {
                        case PRODUCT_TYPE.Color:
                            productDetail['color'] = productInBasket.ProductVariant.variant_value.color_name
                            break;
                        case PRODUCT_TYPE.Size:
                            productDetail['size'] = productInBasket.ProductVariant.variant_value.size
                            break;
                        case PRODUCT_TYPE.ColorSize:
                            productDetail['color'] = productInBasket.ProductVariant.variant_value.color_name
                            productDetail['size'] = productInBasket.ProductVariant.variant_value.size
                            break;
                        case PRODUCT_TYPE.Other:
                            productDetail.variantDetail = productInBasket.ProductVariant.variant_value
                            break;
                        default:
                            break;
                    }
                }
    
                // Calculate basket total_price, price and discount again
                let discount = 0;
                const price = quantity * productPrice

                if(productDiscountStatus) {
                    discount = ((productPrice * productDiscount) / 100) * quantity
                }                                

                // Calculate each product summary
                productDetail['quantity'] = quantity;
                productDetail['price'] = productPrice
                productDetail['totalPrice'] = price
                productDetail['discount'] = discount
                productDetail['totalPriceAfterDiscount'] =  Number(price - discount)
                
                // Calculate totalPrice of basket
                total_price += price;
                total_price_after_discount += productDetail['totalPriceAfterDiscount'];
                total_discount += discount
    
                BasketItems.push(productDetail);
            }
            //  END basketProducts

            return {
                countOfProducts: BasketItems.length ?? 0,
                totalPrice: total_price,
                totalDiscount: total_discount,
                totalPriceAfterDiscount: total_price_after_discount,
                products: BasketItems
            }
}

// async function checkStock(basketId){
//     const basketProducts = await BasketProduct.findAll({
//         where:{basket_id: basketId},
//         include: [
//             {model: Product},{model: ProductVariants}
//         ]});

//         if(!basketProducts) {
//             return {
//                 count: 0,
//                 totalPrice: 0,
//                 totalDiscount: 0,
//                 products: []
//             }
//         }

//     basketProducts.forEach(async (product) => {
//         const itemDetail = {
//             message: ""
//         };
//         // Check product count in stock

//         // if quantity is more than stock then set quantity to stock
//         if(product.ProductVariant){
//             //Variants
//             if(product.quantity > product.ProductVariant.count){
//                 // Calculate basket total_price, price and discount again
//                 const pCount = Number(product.ProductVariant.count)
//                 product.quantity = pCount;
//                 await product.save();
//                 itemDetail.quantity = pCount;
//                 itemDetail.message = `Quantity of this product is changed to ${pCount}` ;
//             }
//         }else{
//             // Single Product
//             if(product.quantity > product.Product.count){
//                 // Calculate basket total_price, price and discount again
//                 const pCount = Number(product.Product.count)
//                 const pPrice = Number(product.Product.price)
//                 const pDiscount = Number(product.Product.discount)
//                 const pDiscountStatus = product.Product.discount_status

//                 product.quantity = pCount;
//                 product.price = pCount * pPrice
//                 product.discount = 0;

//                 if(pDiscountStatus) {
//                     product.discount = ((pPrice * pDiscount) / 100) * pCount
//                 }                                

//                 product.total_price =  Number(product.price - product.discount)
    
//                 await product.save();
//                 itemDetail.quantity = pCount;
//                 itemDetail.message = `Quantity of this product is changed to ${pCount}` ;
//             }
//         }
//         // if product count is 0 then set quantity to 0 and remove from basket

        
//         itemDetail.name = product.Product.title
//         console.log(product.Product.title);

//         if(product.ProductVariant){
//             switch (product.ProductVariant.variant_type) {
//                 case PRODUCT_TYPE.Color:
//                     itemDetail.color = product.ProductVariant.variant_value.color_name
//                     break;
//                 case PRODUCT_TYPE.Size:
//                     itemDetail.size = product.ProductVariant.variant_value.size
//                     break;
//                 case PRODUCT_TYPE.ColorSize:
//                     itemDetail.color = product.ProductVariant.variant_value.color_name
//                     itemDetail.size = product.ProductVariant.variant_value.size
//                     break;
//                 case PRODUCT_TYPE.Other:
//                     itemDetail.variantDetail = product.ProductVariant.variant_value
//                     break;
//             }
//         }

//         itemDetail.quantity= product.quantity
//         itemDetail.price= product.price
//         itemDetail.discount= product.discount
//         itemDetail.total_price= product.total_price
//         itemDetail.removedFromBasket = true    // If count is not 0 then it will be true

//         BasketItems.push(itemDetail);
//     })
// }

module.exports = {
    addProductToBasket,
    getProductInBasket
}
