const createHttpError = require("http-errors");
const { Role, Permission } = require("./rbac.model");
const { checkUserExist } = require("../user/user.service");

async function createRole(req,res,next) {
    try {
        const {name, description} = req.body;
        
        // Check for duplicate role
        await checkDuplicateRole(name)
        
        const role = await Role.create({name,description})

        return res.json({
            message: `Role "${name}" created.`,
            role
        })
        
    } catch (error) {
        next(error)
    }
}

async function showRoles(req,res,next) {
    try {
        const roles = await Role.findAll({include: {model: Permission}});
        const transformedRoles = roles.map(role=>{
            const rolePermissions = role.Permissions?.map(rolePerm=>{
                return {[rolePerm.name]: rolePerm.description}
            });
            
            return {
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: rolePermissions
            }
        })
        
        return res.json({
            roles: transformedRoles
        });

    } catch (error) {
        next(error);
    }
}

async function createPermission(req,res,next) {
    try {
        const {name, description} = req.body;
        await checkDuplicatePermission(name);
        const permission = await Permission.create({name, description});

        return res.json({
            message: `Permission "${name}" created.`,
            permission
        })
        
    } catch (error) {
        next(error)
    }
}


async function showPermissions(req,res,next) {
    try {
        const permissions = await Permission.findAll();
        
        return res.json({
            permissions
        });

    } catch (error) {
        next(error);
    }
}

async function assignPermissionToRole(req,res,next) {
    try {
        let {roleId, permissionId} = req.body;

        if (!Array.isArray(permissionId)) permissionId = [permissionId]
        
        // Check role and permission exist
        const role = await checkRoleExist(roleId);
        const permission = await Promise.all(permissionId.map(async permId=>{
            return checkPermissionExist(permId)
        }));

        await role.addPermissions(permission.map(perm => perm.id));

        const updatedPermissions = await transformPermissions(await role.getPermissions());

        return res.json({
            role,
            permissions: updatedPermissions
        });

    } catch (error) {
        next(error);
    }
}

async function removePermissionFromRole(req,res,next) {
    try {
        const {roleId, permissionId} = req.body;

        // Check role and permission exist
        const role = await checkRoleExist(roleId);
        const permission = await checkPermissionExist(permissionId);

        await role.removePermissions(permission);

        const permissions = await transformPermissions(await role.getPermissions());

        return res.json({
            role,
            permissions
        });

    } catch (error) {
        next(error);
    }
}

async function assignRoleToUser(req,res,next) {
    try {
        const {roleId, userId} = req.body;
        const user = await checkUserExist(userId);
        const role = await checkRoleExist(roleId);

        await user.addRoles(role);

        const roles = await transformRoles(await user.getRoles());

        return res.json({
            user,
            roles
        })
    } catch (error) {
        next(error)
    }
}

async function checkRoleExist(id) {
    const role = await Role.findByPk(id);
    return new Promise((resolve,reject)=>{
        if(role) {
            resolve(role);
        }else{
            reject(createHttpError.NotFound(`Role "${id}" not found.`))
        }
    })
}

async function checkPermissionExist(id) {
    const permission = await Permission.findByPk(id);
    return new Promise((resolve,reject)=>{
        if(permission) {
            resolve(permission);
        }else{
            reject(createHttpError.NotFound(`Permission "${id}" not found.`))
        }
    })
}

async function checkDuplicateRole(roleName) {
    try {
        const role = await Role.findOne({where: {name: roleName}});
        return new Promise((resolve,reject)=>{
            if(role) {
                reject(createHttpError.Conflict('Duplicate role name'));
            }else{
                resolve('Ok');
            }
        })
    } catch (error) {
        debugDb(`checkDuplicateRole function`);
        throw new Error(error,{cause: 'checkDuplicateRole'})
    }
}

async function checkDuplicatePermission(permissionName) {
    try {
        const permission = await Permission.findOne({where: {name: permissionName}});
        return new Promise((resolve,reject)=>{
            if(permission) {
                reject(createHttpError.Conflict('Duplicate permission name'));
            }else{
                resolve('Ok');
            }
        })
    } catch (error) {
        debugDb(`checkDuplicateRole function`);
        throw new Error(error,{cause: 'checkDuplicateRole'})
    }
}

async function transformPermissions(permissions) {
    try {
        const transformedPermissions =  permissions.map(perm=>{
            return {
                name: perm['name'],
                description: perm['description']
            }
        });
        return transformedPermissions;
    } catch (error) {
        throw new Error(error,{cause: 'transformPermissions'})
    }
}

async function transformRoles(roles) {
    try {
        const transformedRoles = roles.map(role=>{
            return {
                name: role['name'],
                description: role['description']
            }
        })
        return transformedRoles;
    } catch (error) {
        throw new Error(error,{cause: 'transformRoles'})
    }
}

module.exports = {
    createRole,
    createPermission,
    assignPermissionToRole,
    removePermissionFromRole,
    showPermissions,
    showRoles,
    assignRoleToUser,
    transformRoles
}