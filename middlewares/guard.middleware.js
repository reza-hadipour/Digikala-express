const createHttpError = require("http-errors");

function guard(roleName) {
    return async (req,res,next)=>{
        const userRoles =  req.user.Roles;

        // Extract permission names from user roles
        const permissions = await Promise.all(userRoles.map(role => role.getPermissions()));
        const permissionNames = permissions.flat().map(permission => permission.name);

        if(permissionNames.includes(roleName)){
            next();
        }else{
            next(createHttpError.Forbidden("Access denied."))
        }
    }
}

module.exports = {
    guard
}