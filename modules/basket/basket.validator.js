const { checkSchema, isUUID } = require("express-validator")

module.exports.addToBasketValidator = ()=>{
    return checkSchema({
        productId: {
            isUUID : {
                errorMessage: "ProductId is not valid."
            }
        },
        quantity: {
            isNumeric:{
                options:{
                    no_symbols: true
                },
                errorMessage: "Quantity must be numeric."
            },
            isInt:{
                options:{
                    min: 1
                },
                errorMessage: "Minimum value of Quantity is 1."
            }
        },
        variantId:{
            optional:true,
            // isULID:{
            //     errorMessage: "VariantId is not valid."
            // }
        }
    })
}
