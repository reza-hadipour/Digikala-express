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


module.exports = {
    checkUserExist
}