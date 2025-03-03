const {checkSchema} = require('express-validator');
const { PRODUCT_TYPE } = require('../../common/constants/product.const');

module.exports.createProductValidator = ()=>{
    return checkSchema({
        title:{
            trim: true,
            notEmpty: {
                errorMessage: "Title is empty"
            },
            isLength:{
                options:{min: 3},
                errorMessage: "Title is short",
            }
        },
        price:{
            custom: {
                options: (price, { req, location }) => {
                    if (!price && !req[location].variants) {
                        throw new Error('Price field is mandatory');
                    } else if (price && !req[location].variants) {
                        if(Number.isNaN(+price)) throw new Error("Price must be numeric");
                    }
                    return true;
                }
            }
        },
        count:{
            custom: {
                options: (count, { req, location }) => {
                    if (!count && !req[location].variants) {
                        throw new Error('count field is mandatory');
                    } else if (count && !req[location].variants) {
                        if(Number.isNaN(+count)) throw new Error("Count must be numeric");
                    }
                    return true;
                }
            }
        },
        discount:{
            isNumeric: {
                errorMessage: "Discount must be numeric",
            },
            optional: true
        },
        discount_status: {
            isBoolean:{
                errorMessage: "Discount_status must be boolean"
            },
            optional: true
        },
        features: {
            optional: true,
            isArray: {
                options: {
                    min: 1
                },
                errorMessage: "Features must be array with minimum one feature"
            },
            custom: {
                options: (value) => {
                    if(value){
                        return value.every(element => {
                            const keys = Object.keys(element);
                            const values = Object.values(element);
                            return keys.every(key => key.trim() !== '') && values.every(value => value.trim() !== '')
                        })
                    }
                    return true
                },
                errorMessage: "'Each element in the features must have a non-empty string property'"
            }
        },
        variants: {
            optional: true,
            isArray: {
                options:{
                    min: 1,
                },
                errorMessage: "Variants must be array with minimum one variant"
            },
        },
        'variants.*.variant_type': {
            isIn:{
                options:[[...Object.values(PRODUCT_TYPE)]],
                errorMessage: "variant_type is not valid"
            },
            notEmpty:{errorMessage:"variant_type must have value"},
            custom: {
                options: (variant,{req,location,pathValues}) => {
                    if (variant === PRODUCT_TYPE.Color){

                        if(!req[location].variants[+pathValues]['variant_value']['color_name']){
                            throw new Error("The 'color_name' field is required for color variants.")
                        }

                        if(!req[location].variants[+pathValues]['variant_value']['color_code']){
                            throw new Error("The 'color_code' field is required for color variants.")
                        }
                        return true;

                    } else if (variant === PRODUCT_TYPE.Size){
                        if(!req[location].variants[+pathValues]['variant_value']['size']){
                            throw new Error("The 'size' field is required for size variants.")
                        }
                        return true;

                    } else if (variant === PRODUCT_TYPE.ColorSize){

                        if(!req[location].variants[+pathValues]['variant_value']['color_name']){
                            throw new Error("The 'color_name' field is required for color-size variants.")
                        }

                        if(!req[location].variants[+pathValues]['variant_value']['color_code']){
                            throw new Error("The 'color_code' field is required for color-size variants.")
                        }

                        if(!req[location].variants[+pathValues]['variant_value']['size']){
                            throw new Error("The 'size' field is required for color-size variants.")
                        }

                        return true;
                    } else {
                        return true;
                    }
                }
            }
        },
        'variants.*.price': {
                        isNumeric:{errorMessage:"Variant`s price must be numeric"}
        },
        'variants.*.count': {
                        isNumeric:{errorMessage:"Variant`s price must be numeric"}
        },
        'variants.*.discount': {
                        isNumeric:{errorMessage:"Variant`s discount must be numeric"},
                        optional: true
        },
        'variants.*.discount_status': {
                        isBoolean:{errorMessage:"Variant`s discount_status must have value"},
                        optional: true
        }
    })
}
// const {checkSchema} = require('express-validator');
// const { PRODUCT_TYPE } = require('../../common/constants/product.const');

// module.exports.createProductValidator = ()=>{
//     return checkSchema({
//         title:{
//             trim: true,
//             notEmpty: {
//                 errorMessage: "Title is empty"
//             },
//             isLength:{
//                 options:{min: 3},
//                 errorMessage: "Title is short",
//             }
//         },
//         type:{
//             trim: true,
//             notEmpty:{
//                 errorMessage: "Type is empty"
//             },
//             isIn:{
//                 options:[[...Object.values(PRODUCT_TYPE)]],
//                 errorMessage: "Type is not valid"}
//         },
//         price:{
//             isNumeric: {
//                 errorMessage: "Price must be numeric",
//             },
//             optional: true
//         },
//         count:{
//             isNumeric: {
//                 errorMessage: "Count must be numeric",
//             },
//             optional: true
//         },
//         discount:{
//             isNumeric: {
//                 errorMessage: "Discount must be numeric",
//             },
//             optional: true
//         },
//         discount_status: {
//             isBoolean:{
//                 errorMessage: "Discount_status must be boolean"
//             },
//             optional: true
//         },
//         features: {
//             optional: true,
//             isArray: {
//                 errorMessage: "Features must be array"
//             },
//             custom: {
//                 options: (value) => {
//                     if(value){
//                         return value.every(element => {
//                             const keys = Object.keys(element);
//                             const values = Object.values(element);
//                             return keys.every(key => key.trim() !== '') && values.every(value => value.trim() !== '')
//                         })
//                     }
//                     return true
//                 },
//                 errorMessage: "'Each element in the features must have a non-empty string property'"
//             }
//         },
//         sizes: {
//             optional: true,
//             isArray: {
//                 errorMessage: "Sizes must be array"
//             },
//         },
//         'sizes.*.size': {
//                         notEmpty:{errorMessage:" Size must have value"}
//         },
//         'sizes.*.count': {
//                         isNumeric:{errorMessage:" count must be numeric"}
//         },
//         'sizes.*.price': {
//                         isNumeric:{errorMessage:" price must be numeric"}
//         },
//         'sizes.*.discount': {
//                         isNumeric:{errorMessage:" discount must be numeric"},
//                         optional: true
//         },
//         'sizes.*.discount_status': {
//                         isBoolean:{errorMessage:" discount_status must have value"},
//                         optional: true
//         },
//         colors: {
//             optional: true,
//             isArray: {
//                 errorMessage: "Colors must be array"
//             },
//         },
//         'colors.*.color_name': {
//                         notEmpty:{errorMessage:" Size must have value"}
//         },
//         'colors.*.color_code': {
//                         notEmpty:{errorMessage:" Size must have value"}
//         },
//         'colors.*.count': {
//                         isNumeric:{errorMessage:" count must be numeric"}
//         },
//         'colors.*.price': {
//                         isNumeric:{errorMessage:" price must be numeric"}
//         },
//         'colors.*.discount': {
//                         isNumeric:{errorMessage:" discount must be numeric"},
//                         optional: true
//         },
//         'colors.*.discount_status': {
//                         isBoolean:{errorMessage:" discount_status must have value"},
//                         optional: true
//         },
//     })
// }

module.exports.createCategoryValidator = ()=>{
    return checkSchema({
        name: {
            trim:true,
            toLowerCase: true,
            notEmpty: {
                errorMessage: "Category name is mandatory"
            }
        },
        description: {
            trim: true,
            optional: true
        }
    })
}