const { validation } = require('../../middlewares/validation.middleware');
const { sendOtp, checkOtp, checkRefresh } = require('./auth.service');
const { sendOtpValidator, checkOtpValidator } = require('./auth.validator');
const router = require('express').Router();




router.post('/sendotp',sendOtpValidator() , validation, sendOtp)
router.post('/checkotp',checkOtpValidator(), validation, checkOtp)
router.get('/refreshToken',checkRefresh)

module.exports = {
    authRouter : router
};