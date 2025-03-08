const { Basket, BasketProduct } = require('./basket.model');
const { Product, ProductVariants } = require('../product/product.model');
const createHttpError = require('http-errors');
const { Op } = require('sequelize');
const { PRODUCT_TYPE } = require('../../common/constants/product.const');

async function addProductToBasket (req,res,next){
    try {
        console.log("Hello");
        const userId = req.user.id
        console.log(userId);

        const {productId,variantId = undefined, quantity = 1} = req.body;

        // Check basket
        let basket = await Basket.findOne({where:{"user_id": userId}});

        if(!basket){
            basket = await Basket.create({
                user_id: userId
            });
            console.log('basket',basket);
        }

        const basketId = basket.id

        // Check Product and Variant exists
        let variantFilter = {}
        if(variantId) {
            variantFilter['id'] = variantId;
            // variantFilter['count'] = {[Op.gte]: quantity}
        }

        console.log(variantFilter);

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
        const price = variantId ? product.variants[0].price : product.price;
        const discount = variantId ? product.variants[0].discount : product.discount;
        const discount_status = variantId ? product.variants[0].discount_status : product.discount_status

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

            const result = await productInBasket.update({'quantity': productInBasketData['quantity']},{raw: false})
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
    try {
        const basketProducts = await BasketProduct.findAll({where:{basket_id: basketId},
            include: [
                {
                    model: Product,
                },
                {
                    model: ProductVariants,
                }
            ]});

            if(!basketProducts) {
                return {
                    totalPrice: 0,
                    totalDiscount: 0,
                    products: []
                }
            }
            
    
            
            let BasketItems = [];
            basketProducts.forEach(async (product) => {
                const itemDetail = {
                    message: ""
                };
                // Check product count in stock

                // if quantity is more than stock then set quantity to stock
                if(product.ProductVariant){
                    //Variants
                    if(product.quantity > product.ProductVariant.count){
                        // Calculate basket total_price, price and discount again
                        const pCount = Number(product.ProductVariant.count)
                        const pPrice = Number(product.ProductVariant.price)
                        const pDiscount = Number(product.ProductVariant.discount)
                        const pDiscountStatus = product.ProductVariant.discount_status

                        product.quantity = pCount;
                        product.price = pCount * pPrice
                        product.discount = 0;

                        if(pDiscountStatus) {
                            product.discount = ((pPrice * pDiscount) / 100) * pCount
                        }                                

                        product.total_price =  Number(product.price - product.discount)
            
                        await product.save();
                        itemDetail.quantity = pCount;
                        itemDetail.message = `Quantity of this product is changed to ${pCount}` ;
                    }
                }else{
                    // Single Product
                    if(product.quantity > product.Product.count){
                        // Calculate basket total_price, price and discount again
                        const pCount = Number(product.Product.count)
                        const pPrice = Number(product.Product.price)
                        const pDiscount = Number(product.Product.discount)
                        const pDiscountStatus = product.Product.discount_status

                        product.quantity = pCount;
                        product.price = pCount * pPrice
                        product.discount = 0;

                        if(pDiscountStatus) {
                            product.discount = ((pPrice * pDiscount) / 100) * pCount
                        }                                

                        product.total_price =  Number(product.price - product.discount)
            
                        await product.save();
                        itemDetail.quantity = pCount;
                        itemDetail.message = `Quantity of this product is changed to ${pCount}` ;
                    }
                }
                // if product count is 0 then set quantity to 0 and remove from basket

                
                itemDetail.name = product.Product.title
                console.log(product.Product.title);
    
                if(product.ProductVariant){
                    switch (product.ProductVariant.variant_type) {
                        case PRODUCT_TYPE.Color:
                            itemDetail.color = product.ProductVariant.variant_value.color_name
                            break;
                        case PRODUCT_TYPE.Size:
                            itemDetail.size = product.ProductVariant.variant_value.size
                            break;
                        case PRODUCT_TYPE.ColorSize:
                            itemDetail.color = product.ProductVariant.variant_value.color_name
                            itemDetail.size = product.ProductVariant.variant_value.size
                            break;
                        case PRODUCT_TYPE.Other:
                            itemDetail.variantDetail = product.ProductVariant.variant_value
                            break;
                    }
                }
    
                itemDetail.quantity= product.quantity
                itemDetail.price= product.price
                itemDetail.discount= product.discount
                itemDetail.total_price= product.total_price
                itemDetail.existsInBasket = true    // If count is not 0 then it will be true
    
                BasketItems.push(itemDetail);
            })

            const itemCount = BasketItems.length ?? 0;

            
            // Calculate totalPrice and products
    
            const totalPrice = basketProducts.reduce((acc, product) => {
                return acc + Number(product.total_price)
            },0)
    
            const totalDiscount = basketProducts.reduce((acc, product)=>{
                return acc + Number(product.discount);
            },0)
    

            return {
                count: itemCount,
                totalPrice,
                totalDiscount,
                products: BasketItems
            }

    } catch (error) {
        next(error)
    }
}

module.exports = {
    addProductToBasket,
    getProductInBasket
}
