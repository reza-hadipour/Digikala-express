const { Basket, BasketProduct } = require('./basket.model');
const { Product, ProductVariants } = require('../product/product.model');
const createHttpError = require('http-errors');
const { Op } = require('sequelize');
const { PRODUCT_TYPE } = require('../../common/constants/product.const');


async function addProductToBasket (req,res,next){
    try {
        const userId = req.user.id
        const {productId, variantId = undefined, quantity = 1} = req.body;

        // Check basket
        let basket = await getBasketByUserId(userId);
        if(!basket) await createBasketByUserId(userId);
        const basketId = basket.id

        // Check Product and Variant exists
        const product = await findProductByPidVid(productId,variantId);
        if(!product) throw new createHttpError.NotFound("Product not found");

        if(!variantId && !product.price)  throw new createHttpError.BadRequest("Product has variants, select one to add to basket");

        // Check product in basket and increase the amount of the product
        let productInBasketFilter = {
            basket_id : basketId,
            product_id : productId,
        }

        if(variantId) productInBasketFilter['variant_id'] = variantId;

        // Product details
        const count = variantId ? product.variants[0].count : product.count;
        
        let productInBasketData = {
            basket_id: basketId,
            product_id: productId,
            variant_id: variantId,
        };

        const productInBasket = await BasketProduct.findOne({where:productInBasketFilter})
        if(productInBasket) {
            // Duplicate Product
            const {quantity: quantityInBasket } = productInBasket
            if(count < (+quantity + quantityInBasket)) throw new createHttpError.NotAcceptable("There is not enough stock for this product");
            
            if((+quantity + quantityInBasket) < 1) {
                await productInBasket.destroy();
                return res.json({
                    message: "Product removed from  basket"
                })
            }

            productInBasketData['quantity'] = +quantity + quantityInBasket
            await productInBasket.update({'quantity': productInBasketData['quantity']})
        }else{
            // Check count of product
            if(count < quantity) throw new createHttpError.NotAcceptable("There is not enough stock for this product");
            // CHeck if quantity was lower than 1
            if(quantity < 1) throw new createHttpError.NotAcceptable("Quantity of product can not be negative number");
            
            productInBasketData['quantity'] = +quantity
            await BasketProduct.create(productInBasketData);
        }

        return res.json({
            message: "Product added to basket successfully",
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
        const userId = req.user.id;

        // Get BasketID
        const basket = await getBasketByUserId(userId);
        if(!basket) {
            return {
                countOfProducts: 0,
                totalPrice: 0,
                totalDiscount: 0,
                totalPriceAfterDiscount: 0,
                products: []
            }
        }

        const basketId = basket?.id;

        // Get Products & Variants in BasketProduct
        const basketItems = await getBasketItems(basketId);

        return res.json(basketItems);
        
    } catch (error) {
        next(error)
    }
}

async function getBasketItemByBasketId(basketId) {
    return await BasketProduct.findAll({
        where:{basket_id: basketId},
        include: [
            {model: Product},{model: ProductVariants}
        ],
        order: [['updatedAt','ASC']]});
}

async function getBasketItems(basketId = undefined) {
        const basketProducts = await getBasketItemByBasketId(basketId);

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
                removedFromBasket: false,
                name: productInBasket.Product.title
            };

            // Check product count in stock
            // if quantity is more than stock then set quantity to stock
            await checkProductCount(productInBasket, productDetail)
            handleProductVariantDetails(productInBasket, productDetail);
            calculateProductSummary(productInBasket, productDetail)

            // Calculate totalPrice of basket
            total_price += productDetail['totalPrice'];;
            total_price_after_discount += productDetail['totalPriceAfterDiscount'];
            total_discount += productDetail['discount'];

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


async function checkProductCount(productInBasket,  productDetail) {
    if(productInBasket.ProductVariant){
        //Variants
        if(productInBasket.quantity > productInBasket.ProductVariant.count && productInBasket.ProductVariant.count != 0){
            productInBasket.quantity = productInBasket.ProductVariant.count;
            await productInBasket.save();
            productDetail['message'] = `Quantity of this product is changed to ${productInBasket.quantity}` ;
        } else if( productInBasket.ProductVariant.count == 0){
            await productInBasket.destroy();
            productDetail['removedFromBasket'] = true
            productDetail['message'] = `This product is removed from basket, there is no product in store.` ;
        }
    }else{
        // Single Product
        if(productInBasket.quantity > productInBasket.Product.count && productInBasket.Product.count != 0){
            productInBasket.quantity = productInBasket.Product.count;
            // productInBasket.quantity = productCount;
            await productInBasket.save();
            productDetail['message'] = `Quantity of this product is changed to ${productInBasket.quantity}` ;
        }else if( productInBasket.Product.count == 0){
            await productInBasket.destroy();
            productDetail['removedFromBasket'] = true
            productDetail['message'] = `This product is removed from basket, there is no product in store.` ;
        }
    }
    
    // Get Product price, discount and discountStatus
    const itemType = productInBasket.ProductVariant ? 'ProductVariant' : 'Product'
    productDetail['productPrice'] = Number(productInBasket[itemType].price)
    productDetail['productDiscount'] = Number(productInBasket[itemType].discount)
    productDetail['productDiscountStatus'] = Number(productInBasket[itemType].discount_status)

}

function calculateProductSummary(productInBasket, productDetail) {
    productDetail['quantity'] = productInBasket.quantity;
    productDetail['totalPrice'] = productDetail['quantity'] * productDetail['productPrice'];
    productDetail['discount'] = productDetail['productDiscountStatus'] ? ((productDetail['productPrice'] * productDetail['productDiscount']) / 100) * productDetail['quantity'] : 0;
    productDetail['totalPriceAfterDiscount'] = Number(productDetail['totalPrice'] - productDetail['discount']);
}

async function handleProductVariantDetails(productInBasket, productDetail){
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
}


async function getBasketByUserId(userId){
    return await Basket.findOne({where:{"user_id": userId}});
}

async function createBasketByUserId(userId){
    return await Basket.create({
        user_id: userId
    });
}

async function findProductByPidVid(productId, variantId= undefined){
    let variantFilter = {}
        if(variantId) {
            variantFilter['id'] = variantId;
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

        return product;
}

module.exports = {
    addProductToBasket,
    getProductInBasket
}
