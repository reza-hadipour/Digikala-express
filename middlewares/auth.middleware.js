const passport = require("passport")

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

        next()

    })(req,res,next)
}