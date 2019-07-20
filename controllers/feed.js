const {validationResult} = require('express-validator/check');
const Post = require('../models/post');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const io = require('../socket');


exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find().skip((currentPage - 1) * perPage).limit(perPage);
        res.status(200).json({
            message: 'Fetched Post is success',
            posts: posts,
            totalItems: totalItems
        });
    } catch (error) {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getSinglePost = (req, res, next) => {
    const postId = req.params.postId
    Post.findById(postId).then(result => {
        console.log(result);
        res.status(200).json({
            post: result
        });
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.createPosts = (req, res, next) => {
    const title = req.body.title
    const content = req.body.content
    const errors = validationResult(req);
    let creator;
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    if(!req.file){
        const error = new Error('No Images Found');
        error.statusCode = 422;
        throw error;
    }
    const post = new Post({
        title: title, 
        content: content,
        imageUrl: req.file.path,
        creator: req.userId
    });

    post.save().then(result => {
        return User.findById(req.userId).populate('creator');
    }).then(user => {
        creator = user;
        user.posts.push(post);
        return user.save();
    }).then(result => {
        io.getIO().emit('posts', {
            action: 'create',
            post: {...post._doc, creator: {_id: req.userId, name: user.name}}
        });
        res.status(201).json({
            message: 'Post Created Successfully',
            post: post,
            creator: {_id: creator._id, name: creator.name}
        });
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const title = req.body.title;
    let imageUrl = req.body.image;
    const content = req.body.content;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, Entered Data is Invalid');
        error.statusCode = 422;
        throw error
    }
    if(req.file){
        imageUrl = req.file.path;
    }
    if(!imageUrl){
        const error = new Error('No Picture Founded');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId).then(post => {
        if(!post){
            const error = new Error('Could not found post');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error('UnAuthorized');
            error.statusCode = 403;
            throw error;
        }
        if(imageUrl !== post.imageUrl){
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        return post.save();
    }).then(result => {
        res.status(200).json({message: 'Post Updated', post: result});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.postDelete = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId).then(post => {
        if(!post){
            const error = new Error('Post Not Found');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error('UnAuthorized');
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    }).then(result => {
        return User.findById(req.userId);
    }).then(user => {
        user.posts.pull(postId);
        return user.save();
    }).then(result => {
        res.status(200).json({message: 'Delete Post Successfull'});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}