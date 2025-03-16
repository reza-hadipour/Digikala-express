const { checkSchema } = require("express-validator")

module.exports.createRolePermissionValidator = ()=>{
    return checkSchema({
        name: {
            notEmpty:{
                negated: true,
                options:{
                    ignore_whitespace: true
                },
                errorMessage: "Name can not be empty."
            }
        },
        description: {
            notEmpty:{
                negated: true,
                options:{
                    ignore_whitespace: true
                },
                errorMessage: "Description can not be empty."
            }
        }
    })
}

module.exports.assignRemovePermissionToRoleValidator = ()=>{
    return checkSchema({
        roleId: {
            notEmpty:{
                errorMessage: "Role id can not be empty."
            }
        },
        permissionId: {
            notEmpty:{
                errorMessage: "Permission id can not be empty."
            }
        }
    })
}

module.exports.assignRoleToUserValidator = ()=>{
    return checkSchema({
        userId:{
            isUUID:{
                errorMessage: "User Id is not provided or is invalid."
            }
        },
        roleId:{
            notEmpty:{
                errorMessage: "Role Id is not provided."
            }
        }
    })
}