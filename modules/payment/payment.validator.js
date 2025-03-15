const { checkSchema } = require("express-validator")

module.exports.paymentVerificationValidator = () => {
    return checkSchema({
        "Status": {
            isEmpty: {
                negated: true,
                options: {
                    ignore_whitespace: true
                },
                errorMessage: "Status is not provided or has invalid value"
            },
            isIn: {
                options: [['OK', 'NOK']],
                errorMessage: "Status must be either 'OK' or 'NOK'"
            }
        },
        "Authority": {
            isEmpty: {
                negated: true,
                options: {
                    ignore_whitespace: true
                },
                errorMessage: "Authority is not provided."
            },
            isLength: {
                options: {
                    min: 5
                },
                errorMessage: "Authority value is not valid"
            }
        }
    })
}
