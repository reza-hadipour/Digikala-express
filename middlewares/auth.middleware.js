const passport = require("passport");
const { redisClient } = require("../configs/redis.config");

module.exports.authenticate = function(req,res,next){

    passport.authenticate('jwt',{session: false},(err,user,info)=>{
        
        if( err || !user){
            return res.status(401).json({
                status: "failed",
                error: {
                    message: "UNAUTHORIZED",
                    info,
                    err
                }
            })
        }

        // check for logged out users
        // check redis for refreshToken: ref:{user.mobile} if not don't let sign in
        checkRefreshTokenExist(user.mobile)
        .then( () => {
            req.user = user;
            next();
        })
        .catch( err => {
            debugRedis(`Looking for refreshToken: ${err}`);
            return res.status(401).json({
                message: "Sign in please."
            })
        })
        
    })(req,res,next)
}

async function checkRefreshTokenExist(mobile) {
    return new Promise(async (resolve,reject)=>{
        redisClient.exists(`ref:${mobile}`)
        .then(reply => {
            if(reply === 1){
                resolve(reply);
            }else{
                reject(0)
            }
        }).catch( err => {
            reject(err);
        })
    })
}