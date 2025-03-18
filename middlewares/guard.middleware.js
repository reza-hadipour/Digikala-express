const createHttpError = require("http-errors");

function guard(permission) {
    return async (req,res,next)=>{
        const userRoles =  req.user.Roles;

        // Extract permission names from user roles
        const permissions = await Promise.all(userRoles.map(role => role.getPermissions()));
        const permissionNames = permissions.flat().map(permission => permission.name);

        permission = (Array.isArray(permission)) ?  [...permission] : [permission];
        const allowed = permission.some(perm=> permissionNames.includes(perm));

        if(allowed){
            next();
        }else{
            next(createHttpError.Forbidden("Access denied."))
        }

    }
}

module.exports = {
    guard
}