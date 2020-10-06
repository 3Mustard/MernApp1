const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const User = require('../../models/User');

// @route   GET api/auth
// @desc    Test route
// @access  Public
// @params route'',middleware*,callback function(), *middleware will be called when this route recieves the GET request.
router.get('/', auth, async (req, res) => {
  try {
    // Find and return user based on id and omit the password field.
    const user = await User.findById(req.user.id).select('-password'); // NOTE: req.user is assigned in auth middleware 
    res.json(user);
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
