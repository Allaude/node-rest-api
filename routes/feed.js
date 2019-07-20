const express = require('express');
const feedController = require('../controllers/feed');
const { body } = require('express-validator/check');
const router = express.Router();
const isAuth = require('../middleware/is-auth');

router.get('/posts', isAuth, feedController.getPosts);
router.post('/posts', isAuth, [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.createPosts);
router.get('/post/:postId', isAuth, feedController.getSinglePost);
router.put('/post/:postId', isAuth, [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.updatePost);
router.delete('/post/:postId', isAuth, feedController.postDelete);
module.exports = router;