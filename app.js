const path = require('path');
const express = require('express');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images')
    },
    filename: (req, file, callback) => {
        callback(null, new Date().toString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, callback) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        callback(null, true);
    } else {
        callback(null, false);
    }
}

app.use(bodyParser.json());
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

const MONGODB_URI = 'your db set up';
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data});
});


mongoose.connect(MONGODB_URI).then(result => {
   const server = app.listen(8080);
   const io = require('./socket').init(server);
   io.on('connection', socket => {
       console.log('Connected');
   })

}).catch(err => console.log(err));
