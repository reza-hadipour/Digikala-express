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
        }
    })
}