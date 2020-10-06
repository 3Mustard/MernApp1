const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
// @params route'',middleware*,callback function(), *middleware will be called when this route recieves the GET request.
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile
      .findOne({ user: req.user.id }) // Find profile based on the user associated with it
      .populate('user', ['name', 'avatar']); // Return this data from the User object as well as the Profile
    // If no Profile is found
    if(!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile); // Response: current user's profile
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server error'); // Status 500: Internal Server Error
  }
});

module.exports = router;
