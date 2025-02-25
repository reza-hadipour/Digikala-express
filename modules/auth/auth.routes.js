const { sendOtp } = require('./auth.service');
const router = require('express').Router();


router.post('/sendotp',sendOtp)


module.exports = {
    authRouter : router
};