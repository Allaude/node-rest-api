const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const tokenHeader = req.get('Authorization');
    if(!tokenHeader){
        const error = new Error('Not Authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = tokenHeader.split(' ')[1];
    let decodeToken;
    try {
        decodeToken = jwt.verify(token, 'somesupersecret');
    } catch (error) {
        error.statusCode = 500;
        throw error;
    }
    if(!decodeToken){
        const error = new Error('Not Authenticated');
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodeToken.userId;
    next();
}