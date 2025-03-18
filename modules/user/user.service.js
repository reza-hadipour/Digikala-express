const createHttpError = require("http-errors");
const { User } = require("./user.model")

async function checkUserExist(userId) {
    const user = await User.findByPk(userId);

    return new Promise((resolve,reject)=>{
        if(user){
            resolve(user);
        }else{
            reject(createHttpError.NotFound("User not found."))
        }
    })
} 

async function checkUserHasRole(user,role) {
    const roles = await user.getRoles();
    const rolesName =  roles.map((role=>role.name))
    return rolesName.includes(role) ? true: false;
}

module.exports = {
    checkUserExist,
    checkUserHasRole
}