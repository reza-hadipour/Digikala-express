const { Basket, BasketProduct } = require('./basket.model');
const { Product, ProductVariants } = require('../product/product.model');
const createHttpError = require('http-errors');
const { Op } = require('sequelize');

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
            discount: 0
        };
        
        // Product details
        const count = variantId ? product.variants[0].count : product.count;
        const price = variantId ? product.variants[0].price : product.price;
        const discount = variantId ? product.variants[0].discount : product.discount;
        const discount_status = variantId ? product.variants[0].discount_status : product.discount_status

        const productInBasket = await BasketProduct.findOne({where:productInBasketFilter})
        if(productInBasket) {
            // Duplicate Product
            
            productInBasketData = {
                discount:0
            };

            const {quantity: quantityInBasket , price: priceInBasket, discount:discountInBasket} = productInBasket

            if(count < (+quantity + quantityInBasket)) throw new createHttpError.NotAcceptable("There is not enough stock for this product");
            
            productInBasketData['quantity'] = +quantity + quantityInBasket
            productInBasketData['price'] = +priceInBasket + (+price * quantity)
            
            if(discount_status) {
                productInBasketData['discount'] = Number(+discountInBasket + (((price * discount) / 100) * quantity))
            }
                    
            productInBasketData['total_price'] =  (productInBasketData['price'] - productInBasketData['discount'])

            const result = await productInBasket.update(productInBasketData,{raw: false})
            return res.json({
                productInBasketData,
                result,
                product
            });

            
        }else{
            // Check count of product
            if(count < quantity) throw new createHttpError.NotAcceptable("There is not enough stock for this product");
    
            productInBasketData['quantity'] = +quantity
            productInBasketData['price'] =  price * quantity
            
            if(discount_status) {
                productInBasketData['discount'] = ((price * discount) / 100) * quantity
            }
                    
            productInBasketData['total_price'] =  productInBasketData['price'] - productInBasketData['discount']

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

module.exports = {
    addProductToBasket
}
