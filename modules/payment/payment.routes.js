const { authenticate } = require('../../middlewares/auth.middleware');
const { payment, verify } = require('./payment.service');

const router = require('express').Router();

router.get('/',authenticate, payment)
router.get('/verify',verify);

module.exports = {
    payRouter: router
}