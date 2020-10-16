const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
// MIDDLEWARE
const auth = require('../../middleware/auth'); // gives access to req.user 
const checkObjectId = require('../../middleware/checkObjectId');
// MODELS
const Post = require('../../models/Post');
const User = require('../../models/User');

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  // ROUTE
  '/',
  // MIDDLEWARE 1.auth, 2.express validations
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  // CALLBACK
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password'); // Omit password field in return
      // Create Post Object
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      // Save post to DataBase
      const post = await newPost.save();

      res.json(post); // Return the saved post
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get(
  // ROUTE
  '/',
  // MIDDLEWARE 
  auth,
  // CALLBACK 
  async (req, res) => {
    try {
      const posts = await Post.find().sort({ date: -1 }); // date: -1 will sort the most recent to the top
      res.json(posts); 
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get(
  // ROUTE
  '/:id',
  // MIDDLEWARE 1.auth, 2.checkObjectId
  [
    auth, 
    checkObjectId('id')
  ],
  // CALLBACK
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' })
      }

      res.json(post);
    } catch (err) {
      console.error(err.message);

      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});

module.exports = router;
