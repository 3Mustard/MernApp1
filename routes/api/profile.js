const express = require('express');
const axios = require('axios');
const config = require('config');
const { check, validationResult } = require('express-validator'); // @doc https://express-validator.github.io/docs/
const router = express.Router();
const auth = require('../../middleware/auth'); // gives access to req.user 
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

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get(
  // ROUTE
  '/github/:username', 
  // CALLBACK
  async (req, res) => {
    try {
      const uri = encodeURI(
        `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
      );
      const headers = {
        'user-agent': 'node.js',
        Authorization: `token ${config.get('githubToken')}`
      };

      const gitHubResponse = await axios.get(uri, { headers });
      return res.json(gitHubResponse.data);
    } catch (err) {
      console.error(err.message);
      return res.status(404).json({ msg: 'No Github profile found' });
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

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
  // ROUTE
  '/experience',
  // MIDDLEWARE
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('company', 'Company is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
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

    // Deconstruct req.body and build an Exp Object
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req. body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    }

    // Find users profile and add the newExp Object to the experience array
    try { 
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from a profile
// @access  Private
router.delete(
  // ROUTE
  '/experience/:exp_id',
  // MIDDLEWARE
  auth, 
  // CALLBACK
  async (req, res) => {
    try { 
      const profile = await Profile.findOne({ user: req.user.id });
      // Get remove index
      const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
      // Remove experience 
      profile.experience.splice(removeIndex, 1);
      // Save profile
      await profile.save();

      res.json(profile);
    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
  // ROUTE
  '/education',
  // MIDDLEWARE
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'Field of Study is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
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

    // Deconstruct req.body and build an Exp Object
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req. body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    }

    // Find users profile and add the newExp Object to the experience array
    try { 
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from a profile
// @access  Private
router.delete(
  // ROUTE
  '/education/:edu_id',
  // MIDDLEWARE
  auth, 
  // CALLBACK
  async (req, res) => {
    try { 
      const profile = await Profile.findOne({ user: req.user.id });
      // Get remove index
      const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
      // Remove education
      profile.education.splice(removeIndex, 1);
      // Save profile
      await profile.save();

      res.json(profile);
    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/profile/
// @desc    delete profile, user and posts
// @access  Private
router.delete(
  // ROUTE
  '/',
  // MIDDLEWARE
  auth, 
  // CALLBACK
  async (req, res) => {
    try { 
      // remove profile
      await Profile.findOneAndRemove({ user: req.user.id });
      // remove user
      await User.findOneAndRemove({ _id: req.user.id });

      res.json({ msg: 'User deleted' });
    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
