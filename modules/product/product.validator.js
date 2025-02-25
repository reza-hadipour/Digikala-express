const {body, checkSchema} = require('express-validator');
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
        type:{
            trim: true,
            notEmpty:{
                errorMessage: "Type is empty"
            },
            isIn:{
                options:[[...Object.values(PRODUCT_TYPE)]],
                errorMessage: "Type is not valid"}
        },
        price:{
            isNumeric: {
                errorMessage: "Price must be numeric",
            },
            optional: true
        },
        count:{
            isNumeric: {
                errorMessage: "Count must be numeric",
            },
            optional: true
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
                errorMessage: "Features must be array"
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
        sizes: {
            optional: true,
            isArray: {
                errorMessage: "Sizes must be array"
            },
        },
        'sizes.*.size': {
                        notEmpty:{errorMessage:" Size must have value"}
        },
        'sizes.*.count': {
                        isNumeric:{errorMessage:" count must be numeric"}
        },
        'sizes.*.price': {
                        isNumeric:{errorMessage:" price must be numeric"}
        },
        'sizes.*.discount': {
                        isNumeric:{errorMessage:" discount must be numeric"},
                        optional: true
        },
        'sizes.*.discount_status': {
                        isBoolean:{errorMessage:" discount_status must have value"},
                        optional: true
        },
        colors: {
            optional: true,
            isArray: {
                errorMessage: "Colors must be array"
            },
        },
        'colors.*.color_name': {
                        notEmpty:{errorMessage:" Size must have value"}
        },
        'colors.*.color_code': {
                        notEmpty:{errorMessage:" Size must have value"}
        },
        'colors.*.count': {
                        isNumeric:{errorMessage:" count must be numeric"}
        },
        'colors.*.price': {
                        isNumeric:{errorMessage:" price must be numeric"}
        },
        'colors.*.discount': {
                        isNumeric:{errorMessage:" discount must be numeric"},
                        optional: true
        },
        'colors.*.discount_status': {
                        isBoolean:{errorMessage:" discount_status must have value"},
                        optional: true
        },
    })
}