const {checkSchema} = require('express-validator');

module.exports.sendOtpValidator = ()=>{
    return checkSchema({
        mobile: {
            notEmpty:"Mobile is mandatory"
        }
    })
}

module.exports.checkOtpValidator = ()=>{
    return checkSchema({
        mobile: {
            trim:true,
            notEmpty:"Mobile is mandatory"
        },
        code: {
            trim:true,
            notEmpty: "Otp-Code is mandatory"
        }
    })
}