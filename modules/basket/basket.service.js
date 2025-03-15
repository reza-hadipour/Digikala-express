const { Basket, BasketProduct } = require('./basket.model');
const { Product, ProductVariants } = require('../product/product.model');
const createHttpError = require('http-errors');
const { Op } = require('sequelize');
const { PRODUCT_VARIANT, PRODUCT_TYPE } = require('../../common/constants/product.const');
const sequelize = require('../../configs/sequelize.config');


async function addProductToBasket(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const userId = req.user.id
        const { productId, variantId = undefined, quantity = 1 } = req.body;

        // Check Product and Variant exists
        const product = await findProductByPidVid({ productId, variantId }, t);
        if (!product) throw new createHttpError.NotFound("Product not found");
        if (!variantId && !product.price) throw new createHttpError.BadRequest("Product has variants, select one to add to basket");

        // Check basket
        let basket = await getBasketByUserId(userId, t);
        if (!basket) basket = await createBasketByUserId(userId, t);
        const basketId = basket.id

        // Check product in basket and increase the amount of the product
        let productInBasketFilter = {
            basket_id: basketId,
            product_id: productId
        }

        if (variantId) productInBasketFilter['variant_id'] = variantId;

        // Product details
        const count = variantId ? product.variants[0].count : product.count;

        let productInBasketData = {
            basket_id: basketId,
            product_id: productId,
            variant_id: variantId,
        };

        const productInBasket = await BasketProduct.findOne({ where: productInBasketFilter, transaction: t })
        if (productInBasket) {
            // Duplicate Product
            const { quantity: quantityInBasket } = productInBasket
            const newQuantity = +quantity + quantityInBasket;

            if (count < newQuantity) throw new createHttpError.NotAcceptable("There is not enough stock for this product");

            productInBasket.quantity = newQuantity;
            await productInBasket.save({transaction: t});
            // await productInBasket.update({'quantity': productInBasketData['quantity']})
        } else {
            // Check count of product
            if (count < quantity) throw new createHttpError.NotAcceptable("There is not enough stock for this product");

            productInBasketData['quantity'] = +quantity
            await BasketProduct.create(productInBasketData, { transaction: t });
        }

        const cart = await getBasketItems(basketId, t);

        await t.commit();

        return res.json({
            message: "Product added to basket successfully",
            product,
            cart
        });

    } catch (error) {
        await t.rollback();
        debugDb('addProductToBasket fn rolled back due to error:', error);
        next(error)
    }
}

async function removeProductFromBasket(req, res, next) {
    try {
        const userId = req.user.id
        const { productId = undefined, variantId = undefined, quantity = 1 } = req.body;

        if (!productId && !variantId) throw new createHttpError.BadRequest("You must provide product id or variant id");

        // Check basket
        let basket = await getBasketByUserId(userId);
        if (!basket) throw new createHttpError.NotFound("Your basket is empty.");

        const basketId = basket.id

        // Check Product and Variant exists
        const product = await findProductByPidVid({ productId, variantId });
        if (!product) throw new createHttpError.NotFound("Product not found");

        if (!variantId && !product.price) throw new createHttpError.BadRequest("Product has variants, select the one you want to remove from basket");

        // Check product in basket and decrease the quantity of the product in basket
        let productInBasketFilter = {
            basket_id: basketId,
        }

        if (productId) productInBasketFilter['product_id'] = productId;
        if (variantId) productInBasketFilter['variant_id'] = variantId;

        const productInBasket = await BasketProduct.findOne({ where: productInBasketFilter })

        if (productInBasket) {
            const { quantity: quantityInBasket } = productInBasket
            const updatedQuantity = quantityInBasket - quantity;
            let message;

            if (updatedQuantity < 1) {
                await productInBasket.destroy();
                message = `${product?.title} removed from basket`
            } else {
                productInBasket.quantity = updatedQuantity
                await productInBasket.save();
                message = `${product?.title} quantity updated to ${updatedQuantity}`
            }

            const cart = await getBasketItems(basketId);

            return res.json({
                message,
                cart
            })

        } else {
            throw new createHttpError.NotFound("Product not found in basket");
        }

    } catch (error) {
        next(error)
    }
}

async function getProductInBasket(req, res, next) {
    try {
        // Get userid
        const userId = req.user.id;

        // Get BasketID
        const basket = await Basket.findOne({ where: { "user_id": userId } });
        if (!basket) {
            return res.json({
                countOfProducts: 0,
                totalPrice: 0,
                totalDiscount: 0,
                totalPriceAfterDiscount: 0,
                products: []
            })
        }

        const basketId = basket?.id;

        // Get Products & Variants in BasketProduct
        const basketItems = await getBasketItems(basketId);

        return res.json(basketItems);

    } catch (error) {
        next(error)
    }
}

async function getBasketItemByBasketId(basketId, transaction = null) {
    const t = await sequelize.transaction({ transaction });
    try {
        const basketProducts = await BasketProduct.findAll({
            where: { basket_id: basketId },
            include: [
                { model: Product },
                { model: ProductVariants },
            ],
            order: [['updatedAt', 'ASC']],
            transaction: t
        });

        await t.commit()
        return basketProducts;

    } catch (error) {
        await t.rollback();
        debugDb('getBasketItemByBasketId fn rolled back due to error:', error);
        throw new Error(error, { cause: 'getBasketItemByBasketId' })
    }

}

async function getBasketItems(basketId = undefined, transaction = null) {
    const t = await sequelize.transaction({ transaction });
    try {
        const basketProducts = await getBasketItemByBasketId(basketId, t);

        if (!basketProducts) {
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

        await t.commit();
        return {
            countOfProducts: BasketItems.length ?? 0,
            totalPrice: total_price,
            totalDiscount: total_discount,
            totalPriceAfterDiscount: total_price_after_discount,
            products: BasketItems
        }
    } catch (error) {
        await t.rollback();
        debugDb('getBasketItems fn rolled back due to error:', error);
        throw new Error(error, { cause: 'getBasketItems' })
    }
}


async function checkProductCount(productInBasket, productDetail) {
    const itemType = productInBasket.ProductVariant ? PRODUCT_TYPE.variant : PRODUCT_TYPE.product

    if (productInBasket.quantity > productInBasket[itemType].count && productInBasket[itemType].count != 0) {
        productInBasket.quantity = productInBasket[itemType].count;
        await productInBasket.save();
        productDetail['message'] = `Quantity of this product is changed to ${productInBasket.quantity}`;
    } else if (productInBasket[itemType].count == 0) {
        await productInBasket.destroy();
        productDetail['removedFromBasket'] = true
        productDetail['message'] = `This product is removed from basket, there is no product in store.`;
    }

    // Get Product price, discount and discountStatus
    productDetail['productPrice'] = Number(productInBasket[itemType].price)
    productDetail['productDiscount'] = Number(productInBasket[itemType].discount)
    productDetail['productDiscountStatus'] = Boolean(productInBasket[itemType].discount_status)

}

function calculateProductSummary(productInBasket, productDetail) {
    productDetail['quantity'] = productInBasket.quantity;
    productDetail['totalPrice'] = productDetail['quantity'] * productDetail['productPrice'];
    productDetail['discount'] = productDetail['productDiscountStatus'] ? ((productDetail['productPrice'] * productDetail['productDiscount']) / 100) * productDetail['quantity'] : 0;
    productDetail['totalPriceAfterDiscount'] = Number(productDetail['totalPrice'] - productDetail['discount']);
}

async function handleProductVariantDetails(productInBasket, productDetail) {
    if (productInBasket.ProductVariant) {
        const variant = productInBasket.ProductVariant;
        switch (variant.variant_type) {
            case PRODUCT_VARIANT.Color:
                productDetail['color'] = variant.variant_value.color_name
                break;
            case PRODUCT_VARIANT.Size:
                productDetail['size'] = variant.variant_value.size
                break;
            case PRODUCT_VARIANT.ColorSize:
                productDetail['color'] = variant.variant_value.color_name
                productDetail['size'] = variant.variant_value.size
                break;
            case PRODUCT_VARIANT.Other:
                productDetail.variantDetail = variant.variant_value
                break;
            default:
                break;
        }
    }
}


async function getBasketByUserId(userId, transaction = null) {
    const t = await sequelize.transaction({ transaction })
    try {
        const basket = await Basket.findOne({ where: { "user_id": userId }, transaction });
        await t.commit();
        return basket;
    } catch (error) {
        await t.rollback();
        debugDb('getBasketByUserId fn rolled back due to error:', error);
        throw new Error(error, { cause: 'getBasketByUserId' })
    }
}

async function createBasketByUserId(userId, transaction = null) {
    const t = await sequelize.transaction({ transaction });
    try {
        const newBasket = await Basket.create({
            user_id: userId
        });
        await t.commit();
        return newBasket;
    } catch (error) {
        await t.rollback();
        debugDb('createBasketByUserId fn rolled back due to error:', error);
        throw new Error(error, { cause: 'createBasketByUserId' })
    }

}

async function findProductByPidVid(filter, transaction = null) {
    const t = await sequelize.transaction({ transaction });
    try {
        const { productId = undefined, variantId = undefined } = filter;

        const whereVariantClause = variantId ? [{
            model: ProductVariants,
            as: 'variants',
            required: true,
            where: { 'id': variantId },
            attributes: ['id', 'variant_type', 'variant_value', 'count', 'price', 'discount', 'discount_status'],
        }] : []

        const whereClause = productId ? { id: productId } : {};

        const product = await Product.findOne({
            where: whereClause,
            include: whereVariantClause,
            transaction: t
        });

        await t.commit();
        return product;
    } catch (error) {
        await t.rollback();
        debugDb('findProductByPidVid fn rolled back due to error:', error);
        throw new Error(error, { cause: 'findProductByPidVid' })
    }
}

module.exports = {
    addProductToBasket,
    getProductInBasket,
    getBasketByUserId,
    getBasketItemByBasketId,
    getBasketItems,
    removeProductFromBasket,
}
