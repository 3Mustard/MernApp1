const express = require('express');
const { check, validationResult } = require('express-validator'); // @doc https://express-validator.github.io/docs/
const router = express.Router();
const auth = require('../../middleware/auth');
const normalize = require('normalize-url'); // bring in normalize to get a proper url, regardless of what user entered

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/
// @desc    Get all profiles
// @access  Public
router.get(
  // ROUTE
  '/', 
  // CALLBACK
  async (req, res) => {
    try {
      // Find all Profiles and add additional User data with populate
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/profile/user/:user_id
// @desc    Get profile by id
// @access  Public
router.get(
  // ROUTE
  '/user/:user_id', 
  // CALLBACK
  async (req, res) => {
    try {
      // Find a User Profile based on :id in params and add additional User data with populate
      const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

      // No profile found
      if (!profile) return res.status(400).json({ msg: 'Profile not found' });

      res.json(profile);
    } catch(err) {
      console.error(err.message);
      // If the :id is too long it isn't recognized as an object but that isn't a Server Error so this if statement was added.
      if (err.kind == 'ObjectId') {
        return res.status(400).json({ msg: 'Profile not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get(
  // ROUTE
  '/me', 
  // MIDDLEWARE: 1.auth
  auth, 
  // CALLBACK
  async (req, res) => {
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
  }
);

// @route   POST api/profile/
// @desc    Create or update user profile
// @access  Private
router.post(
  // ROUTE
  '/',
  // MIDDLEWARE: 1.auth 2.express validations
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
