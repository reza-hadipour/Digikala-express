const { authenticate } = require('../../middlewares/auth.middleware');
const { validation } = require('../../middlewares/validation.middleware');
const { sendOtp, checkOtp, checkRefresh, logout } = require('./auth.service');
const { sendOtpValidator, checkOtpValidator } = require('./auth.validator');
const router = require('express').Router();




router.post('/sendotp',sendOtpValidator() , validation, sendOtp)
router.post('/checkotp',checkOtpValidator(), validation, checkOtp)
router.get('/refreshToken',checkRefresh)
router.get('/logout',authenticate, logout)
router.get('/profile',authenticate, (req,res)=>{
    res.json(req.user)
})



module.exports = {
    authRouter : router
};