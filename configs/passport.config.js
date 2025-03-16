const passport = require('passport');
const {ExtractJwt, Strategy} = require('passport-jwt');
const { User } = require('../modules/user/user.model');
const { Role } = require('../modules/RBAC/rbac.model');

let options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET
}

passport.use('jwt',new Strategy(options,(jwt_payload,done)=>{
    User.findOne({
        where:{id:jwt_payload.userId},
        include:[
            {model:Role},
        ]
    })
    .then((user)=>{
        if(user){
            return done(null,user)
        }else{
            return done(null,false,jwt_payload)
        }
    })
    .catch(err=>{
        if(err){
            return done(err,false,jwt_payload)
        }
    })
}))