const express = require('express');
const { check, validationResult } = require('express-validator'); // @doc https://express-validator.github.io/docs/
const router = express.Router();
const auth = require('../../middleware/auth');
const normalize = require('normalize-url'); // bring in normalize to get a proper url, regardless of what user entered

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
// @params  route'',middleware*,callback function(), *middleware will be called when this route recieves the GET request.
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

// @route   POST api/profile/
// @desc    Create or update user profile
// @access  Private
router.post(
  // ROUTE
  '/',
  // MIDDLEWARE 1.auth 2.express validations
  [
    auth, 
    [
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'Skills is required')
        .not()
        .isEmpty(),
    ]
  ],
  // CALLBACK 
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Get values from req.body
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook
    } = req.body;

    // Build profileFields object
    const profileFields = {
      user: req.user.id,
      company,
      location,
      website: website && website !== '' ? normalize(website, { forceHttps: true }) : '',
      bio,
      skills: Array.isArray(skills)
        ? skills
        : skills.split(',').map((skill) => ' ' + skill.trim()),
      status,
      githubusername
    };

    // Build social object and add to profileFields
    const socialfields = { youtube, twitter, instagram, linkedin, facebook };

    for (const [key, value] of Object.entries(socialfields)) {
      if (value && value.length > 0)
        socialfields[key] = normalize(value, { forceHttps: true });
    }
    profileFields.social = socialfields;

    try {
      // Using upsert option (creates new doc if no match is found):
      // by default, mongoose returns the old object unless (new: true) is set:
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
