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
                const key = Object.keys(feature)[0];
                featureList.push({
                    key,
                    value: feature[key],
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
                        color_code: item.color_code,
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

        return res.json({
            message: "New Product created successfully",
            newProduct
        })
    } catch (error) {
        next(error)
    }
}

async function getProductList(req,res,next){
    try {
        const products =  await Product.findAll({});
        return res.json(products);
    } catch (error) {
        next(error)
    }
    
}

async function getProduct(req,res,next){
    try {
        const {id} = req.params;
        console.log(id);
        const product = await Product.findByPk(id,{
            include: [
                {model: ProductFeature, as: 'features', attributes: ['key','value']},
                {model: ProductColor, as: "colors", attributes: ['color_name','color_code','count','price','discount','discount_status']},
                {model: ProductSize, as: "sizes", attributes: ['size','count','price','discount','discount_status']}
            ]
        });

        if(!product) throw createHttpError.NotFound("Product not found");

        return res.json({
            product
        })

    } catch (error) {
        next(error)
    }
}

async function deleteProduct(req,res,next) {
    try {
        const {id} = req.params;
        const deleteResult = await Product.destroy({where:{id},cascade:[ProductColor,ProductFeature,ProductSize]});
        return res.json(deleteResult);
    } catch (error) {
        next(error)
    }
}


module.exports = {
    createProduct,
    getProductList,
    getProduct,
    deleteProduct
}