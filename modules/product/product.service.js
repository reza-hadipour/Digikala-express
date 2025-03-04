const createHttpError = require('http-errors');
const { PRODUCT_TYPE } = require("../../common/constants/product.const");
const { Product, ProductVariants, ProductFeatures, Category } = require('./product.model');
const { Op} = require('sequelize');


async function createCategory(req,res,next) {
    try {
        const {name,description} = req.body;

        // Check duplicate category
        const category = await Category.findOne({where: {name}});
        if(category) throw createHttpError.BadRequest("Category name is already taken");

        const newCategory = await Category.create({name,description});
        
        return res.json(newCategory);

    } catch (error) {
        next(error)
    }
}

async function getCategories(req,res,next){
    try {
        const categories = await Category.findAll();
        return res.json(categories);

    }catch(error){
        next(error)
    }
}

async function createCategoryFeatures(req,res,next) {
    try {
        const {feature,category_id} = req.body;

        const featureList = feature.map((elem)=>{
            return {category_id , "feature_key" : elem.key}
        })
        
        await CategoryFeatures.bulkCreate(featureList);
        
        const category = await Category.findByPk(category_id,{
            include: {
                model: CategoryFeatures,
                as: "features",
                attributes: [["feature_key","key"]],
            }
        });

        const featureTransformed = featureTransformer(category.features)

        const categoryJson = category.toJSON();
        categoryJson.features = featureTransformed;
        
        return res.json(categoryJson);

    } catch (error) {
        next(error)
    }
    
}

async function getCategoryFeatures(req,res,next) {
    try {
        const category_id = req.params.catId;
        const category = await Category.findByPk(category_id,{
            include: [
                {
                    model: CategoryFeatures, as: "features",
                    attributes: [['feature_key','key']],
                    required: false
                }
            ]
        })

        if(!category) throw createHttpError.NotFound('Category not found');

        const featureTransformed =  featureTransformer(category.features);
        // category.features.map((obj)=>{
        //     return obj.dataValues['key'];
        // })

        const categoryJson = category.toJSON();
        categoryJson.features = featureTransformed;
        
        return res.json(categoryJson);


    } catch (error) {
        next(error)
    }
    
}

async function truncateCategoryFeatures(req,res,next) {
    try {
        const category_id = req.params.catId;

        await CategoryFeatures.destroy({
            where:{
                category_id
            }
        })

        const category = await Category.findByPk(category_id,{
            include: [
                {
                    model: CategoryFeatures, as: "features",
                    attributes: [['feature_key','key']],
                    required: false
                }
            ]
        })

        if(!category) throw createHttpError.NotFound('Category not found');

        return res.json(category);

    } catch (error) {
        next(error)
    }
    
}

async function createProduct(req, res, next) {
    try {
        let {
            title,
            description,
            count = undefined,
            price = undefined,
            discount = undefined,
            discount_status = undefined,
            category_id = 1,
            features,
            variants,
        } = req.body;


        let variantType = undefined;


        // Check if variant is exists then set price and count to undefined
        if (variants || variants?.length > 0) {
            price = undefined;
            count = undefined;
        }

        // Check if variants is an array and not empty
        if (variants && Array.isArray(variants)) {
            variantType = variants[0].variant_type;

            // Ensure all variants have the same variant_type
            for (const variant of variants) {
                if (variant.variant_type !== variantType) {
                    throw createHttpError.BadRequest(`All variants must have the same variant_type. Type: ${variantType} `);
                }
            }
        }


        const newProduct = await Product.create({
            title,
            description,
            count,
            price,
            discount,
            discount_status,
            category_id,
        });

        // Extract product features
        if (features && Array.isArray(features)) {
            let featureList = [];

            for (const feature of features) {
                const feature_key = Object.keys(feature)[0];
                featureList.push({
                    feature_key,
                    feature_value: feature[feature_key],
                    product_id: newProduct.id
                });
            }

            if (featureList.length > 0) {
                await ProductFeatures.bulkCreate(featureList);
            }
        }

        if (variants && Array.isArray(variants)) {
            let variantsList = [];
            // console.log('In Variants',variantType);

            if(variantType === PRODUCT_TYPE.Color){
                // **** check v.variant_value.color_name in validator
                for (const v of variants) {
                    // Handle color variants
                    variantsList.push({
                        variant_type: variantType,
                        variant_value : {
                            color_name: v.variant_value.color_name,
                            color_code: v.variant_value.color_code
                        },
                        count: v.count,
                        price: v.price,
                        discount: v.discount,
                        discount_status: v.discount_status,
                        product_id: newProduct.id
                    });
                }
    
            }else if (variantType === PRODUCT_TYPE.Size){

                // **** check v.variant_value.size in validator
                for (const v of variants) {
                    // Handle Size variants
                    variantsList.push({
                        variant_type: variantType,
                        variant_value : {
                            size: v.variant_value.size
                        },
                        count: v.count,
                        price: v.price,
                        discount: v.discount,
                        discount_status: v.discount_status,
                        product_id: newProduct.id
                    });
                }    
            }else if (variantType === PRODUCT_TYPE.ColorSize){
                
                // **** check v.variant_value.color_name variant_value.color_code variant_value.size in validator
                for (const v of variants) {
                    // Handle Color-Size variants
                    variantsList.push({
                        variant_type: variantType,
                        variant_value : {
                            color_name: v.variant_value.color_name,
                            color_code: v.variant_value.color_code,
                            size: v.variant_value.size
                        },
                        count: v.count,
                        price: v.price,
                        discount: v.discount,
                        discount_status: v.discount_status,
                        product_id: newProduct.id
                    });
                }
            }

            // console.log(variantsList);
            
            if (variantsList.length > 0) {
                await ProductVariants.bulkCreate(variantsList);
                // await ProductVariants.addProduct(newProduct)
                
            }

        }

        return res.json({
            message: "New Product created successfully",
            newProduct
        });
    } catch (error) {
        next(error);
    }
}

async function getProductList(req, res, next) {
    try {

        const {category: cat} = req.query;

        let categoryFilter = {};

        if(cat) categoryFilter['category_id'] = cat;
        console.log(categoryFilter);

        const products = await Product.findAll({
            where: categoryFilter,
            include: [ 
                {
                    model: Category,
                    attributes: ['name'],
                    // where: categoryFilter
                },
                {
                    model: ProductVariants,
                    as : 'variants',
                    attributes: ['variant_type', 'variant_value', 'count', 'price', 'discount', 'discount_status'],
                } , {
                    model: ProductFeatures,
                    as: 'features',
                    attributes: [['feature_key','key'],['feature_value','value']]
                }],
            order: [['title','ASC'],['count','ASC'],[{model: ProductVariants, as: 'variants'},'price','DESC']]
        });
        return res.json(products);
    } catch (error) {
        next(error);
    }
}

async function getProduct(req, res, next) {
    try {
        const { id } = req.params;
        const {size, color} = req.query;

        let productFilter = {}

        if(size){
            productFilter['variant_value.size'] = {
                [Op.in] : [size]
            }
        }

        if(color){
            productFilter['variant_value.color_name'] = {
                [Op.in] : [color]
            }
        }

        const product = await Product.findByPk(id, {
            include: [
                { model: ProductFeatures,
                as: 'features',
                // where: featureFilter,
                required: true,
                attributes: [['feature_key','key'], ['feature_value','value']],
                },
                { model: ProductVariants,
                    as: 'variants',
                    where: productFilter,
                    required: true,
                    attributes: ['variant_type', 'variant_value', 'count', 'price', 'discount', 'discount_status'],
                 }
            ],
            order: [['title','ASC'],[{model: ProductVariants, as: 'variants'},'price','DESC']]
        });

        if (!product) throw createHttpError.NotFound("Product not found");
        const productJson = product.toJSON();

        // Transform feature to key-value pair: {"material": "fleece"}
        // Access to feature using key and value is more suitable
        // if(Array.isArray(product.features)){
        //     const transformedFeatures = product.features.map((feature)=>{
        //         return { [feature.dataValues.key]: feature.dataValues.value };
        //     })
        //     productJson.features = transformedFeatures;
        // }

        return res.json({
            productJson         
        });


    } catch (error) {
        next(error);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const { id } = req.params;
        const deleteResult = await Product.destroy({ where: { id }, cascade: [ProductVariants,ProductFeatures] });
        return res.json(deleteResult);
    } catch (error) {
        next(error);
    }
}


function featureTransformer(features){
    const list = features.map((obj)=>{
        return obj.dataValues['key'];
    })
    return list;
}

module.exports = {
    createProduct,
    getProductList,
    getProduct,
    deleteProduct,
    createCategory,
    getCategories,
    createCategoryFeatures,
    getCategoryFeatures,
    truncateCategoryFeatures
};
