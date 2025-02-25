const { Op } = require("sequelize");
const { User, Otp } = require("../user/user.model");
const createHttpError = require("http-errors");
const {randomInt} = require('crypto');

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

module.exports = {
    sendOtp
}