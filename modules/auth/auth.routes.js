const { authenticate } = require('../../middlewares/auth.middleware');
const { validation } = require('../../middlewares/validation.middleware');
const { transformRoles } = require('../RBAC/rbac.service');
const { sendOtp, checkOtp, checkRefresh, logout } = require('./auth.service');
const { sendOtpValidator, checkOtpValidator } = require('./auth.validator');
const router = require('express').Router();




router.post('/sendotp',sendOtpValidator() , validation, sendOtp)
router.post('/checkotp',checkOtpValidator(), validation, checkOtp)
router.get('/refreshToken',checkRefresh)
router.get('/logout',authenticate, logout)
router.get('/profile',authenticate, async (req,res, next)=>{
    const user = req.user;
    const role = await transformRoles(await user.getRoles());
    res.json({
        id: req.user['id'],
        fullname: req.user['fullname'],
        mobile: req.user['mobile'],
        role
    })
})



module.exports = {
    authRouter : router
};