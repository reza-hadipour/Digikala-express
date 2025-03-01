const { Op } = require("sequelize");
const { User, Otp } = require("../user/user.model");
const createHttpError = require("http-errors");
const {randomInt} = require('crypto');
const jwt = require('jsonwebtoken');
const { redisClient } = require("../../configs/redis.config");


async function sendOtp(req,res,next){
    try {
        const {mobile} =  req.body;
        const code = randomInt(10000,99999);

        let user = await User.findOne({where:{mobile}})

        if(user){
            // Check for otp is exists or not
            const otp = await Otp.findOne({where: {
                'user_id':user.id,
                'expires_in': {[Op.gt]: new Date(Date.now())}
            }});

            if(otp) throw createHttpError.BadRequest("You have one valid Otp, try later again.")

            const newOtp = await Otp.create({
                code,
                expires_in: new Date(Date.now() + 60000),
                user_id: user.id
            })

            return res.json({
                message: "Otp Send Successfully",
                mobile,
                otp: newOtp
            })
            
        }else{
            // Create user
            user = await User.create({
                mobile
            });

            const newOtp = await Otp.create({
                code,
                expires_in: new Date(Date.now() + 60000),
                user_id: user.id
            });

            // Send SMS

            return res.json({
                message: "New user created and Otp Send Successfully",
                mobile,
                otp: newOtp
            })

        }

    } catch (error) {
        next(error);
    }
}

async function checkOtp(req,res,next) {
    try {
        const {mobile,code} = req.body;
        const currentDate = new Date(Date.now());

        // Check user
        const user = await User.findOne({
            where:{mobile},
            include: [
                {model: Otp, as: 'otp', where: {'code': code}}
            ]
        });


        if(!user) throw createHttpError.Unauthorized("OTP code is wrong") 

        // if(!user) throw createHttpError.NotFound("User white this mobile number not found")

        // if(!user?.otp?.code || user?.otp?.code != code){
        //     throw createHttpError.Unauthorized("OTP code is wrong")
        // }

        if(user.otp.expires_in < currentDate){
            await user.otp.destroy();
            throw createHttpError.Gone("OTP has expired");
        }

        // Destroy OTP                  // Remove current and unused otps
        await Otp.destroy({where: {user_id:user.id}});

        // Generate AccessToken and RefreshToken
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.mobile,user.id);

        redisClient.set(`ref:${user.mobile}`,refreshToken,{EX: 7 * 24 * 60 * 60})   // Set expiration to 7 days
        .then((reply)=>{
            debugRedis(`Value sets in Redis: ${reply}`)
            return res.json({
                User: user,
                accessToken,
                refreshToken
            })
        }).catch(err=>{
            debugRedis(err);
        })



    } catch (error) {
        next(error);
    }
}

async function checkRefresh(req,res,next) {
    try {
        const token = req.headers['x-refresh-token'];
        if(!token) throw createHttpError[401]("No refresh token provided")

            const refreshToken = token.split(" ")[1];

            const {jti,userId} =  jwt.verify(refreshToken,process.env.JWT_REFRESH_TOKEN_SECRET);
            
            if(!jti && !userId) throw new createHttpError.Unauthorized('Unauthorized');

            const redisToken = await redisClient.get(`ref:${jti}`);
            if(redisToken != refreshToken) throw createHttpError[401]("RefreshToken is not valid");

            const newToken = generateAccessToken(userId);

        return res.json({
            accessToken: newToken
        })

    } catch (error) {
        next(error)
    }
    
}

async function logout(req,res,next) {
    try {
        const {mobile} = req.user;
        redisClient.del(`ref:${mobile}`)
        .then(result=>{
            
            console.log('result',result);
            return res.json({
                message: 'User logged out'
            })

        }).catch(err=>{
            debugRedis(err);
            throw new createHttpError.InternalServerError(err)
        })

    } catch (error) {
        next(error)
    }
}

function generateAccessToken(userId){
    return jwt.sign({userId:userId},process.env.JWT_ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
}

function generateRefreshToken(mobile, userId){
    const payload = {'jti':mobile, userId};
    return jwt.sign(payload,process.env.JWT_REFRESH_TOKEN_SECRET,{expiresIn: '7d'})
}

module.exports = {
    sendOtp,
    checkOtp,
    checkRefresh,
    logout
}