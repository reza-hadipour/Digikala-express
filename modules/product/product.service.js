const createHttpError = require('http-errors');
const { PRODUCT_TYPE } = require("../../common/constants/product.const");
const { Product, ProductFeature, ProductColor, ProductSize } = require('./product.model');

async function createProduct(req,res,next){
    try {
        const {
            title,
            price = undefined,
            discount = undefined,
            discount_status = undefined,
            type,
            count = undefined,
            description,
            features,
            sizes,
            colors
        } = req.body;
    
        if(!Object.values(PRODUCT_TYPE).includes(type)){
            throw createHttpError[400]("Product type is not valid");
        }
    
        const newProduct = await Product.create({
            title,
            price,
            discount,
            discount_status,
            type,
            count,
            description
        })
    
        if(features && Array.isArray(features)){
            let featureList = [];
            for (const feature of features) {
                featureList.push({
                    key: feature?.key,
                    value: feature?.values,
                    product_id: newProduct.id
                })
            }
            
            if(featureList.length>0){
                await ProductFeature.bulkCreate(featureList);
            }
        }
    
        if(type === PRODUCT_TYPE.Coloring){
            if(colors && Array.isArray(colors)){
                let colorList = [];
                for(const item of colors){
                    colorList.push({
                        color_name: item.color_name,
                        color_value: item.color_value,
                        count: item.count,
                        price: item.price,
                        discount: item.discount,
                        discount_status: item.discount_status,
                        product_id: newProduct.id
                    })
                }
    
                if(colorList.length>0){
                    await ProductColor.bulkCreate(colorList);
                }
    
            }
        }
    
        if(type === PRODUCT_TYPE.Sizing){
            if(sizes && Array.isArray(sizes)){
                let sizeList = [];
                for(const item of sizes){
                    sizeList.push({
                        size: item.size,
                        count: item.count,
                        price: item.price,
                        discount: item.discount,
                        discount_status: item.discount_status,
                        product_id: newProduct.id
                    })
                }
    
                if(sizeList.length>0){
                    await ProductSize.bulkCreate(sizeList);
                }
    
            }
        }
    } catch (error) {
        next(error)
    }
}


module.exports = {
    createProduct
}