const router = require('express').Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { validation } = require('../../middlewares/validation.middleware');
const { payment, verify } = require('./payment.service');
const { paymentVerificationValidator } = require('./payment.validator');


router.get('/',authenticate, payment)
router.get('/verify', paymentVerificationValidator(), validation ,verify);

module.exports = {
    payRouter: router
}