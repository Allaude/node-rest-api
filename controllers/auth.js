const { validationResult } = require('express-validator/check');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.putSignUp = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    bcrypt.hash(password, 12).then(hashPass => {
        const user = new User({
            email: email,
            password: hashPass,
            name: name,
            status: 'new'
        });
        return user.save()
    }).then(result => {
        res.status(201).json({message: 'User was Created', userId: result._id});
    }).catch(err => {
        if(err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({email: email}).then(user => {
        if(!user){
            const error = new Error('Email not Found');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    }).then(isEqual => {
        if(!isEqual){
            const error = new Error('Password not Match');
            error.statusCode = 422;
            throw error;
        }
        const token = jwt.sign({
            email: loadedUser.email,
            userId: loadedUser._id.toString()
        }, 'somesupersecret', { expiresIn: '1h' });
        res.status(200).json({token: token, userId: loadedUser._id.toString() });
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
            next(err);
        }
    })
}

exports.getStatus = (req, res, next) => {
    User.findById(req.userId).then(user => {
        if(!user){
            const error = new Error('User Not Found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({status: user.status});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
            next(err);
        }
    })
}

exports.updateStatus = (req, res, next) => {
    const status = req.body.status;
    User.findById(req.userId).then(user => {
        if(!user){
            const error = new Error('User Not Found');
            error.statusCode = 404;
            throw error;
        }
        user.status = status;
        return user.save();
    }).then(result => {
        console.log(result);
        res.status(200).json({message: 'Updated Status Successfull'});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
            next(err);
        }
    })
}