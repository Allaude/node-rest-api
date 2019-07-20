const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const {body} = require('express-validator/check');
const User = require('../models/user');
const isAuth = require('../middleware/is-auth');

router.put('/signup', [
    body('email').isEmail().withMessage('Please Enter a Valid Email')
    .custom((value, {req}) => {
        return User.findOne({email: value}).then(userDoc => {
            if(userDoc){
                return Promise.reject('E-mail Already Exist');
            }
        })
    }).normalizeEmail(),
    body('password').trim().isLength({min: 5}),
    body('name').trim().not().isEmpty()
], authController.putSignUp);

router.post('/login', authController.postLogin);
router.get('/check-status', isAuth, authController.getStatus);
router.put('/update-status', isAuth, authController.updateStatus);

module.exports = router;