const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator'); // @doc https://express-validator.github.io/docs/

const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user
// @access  Public
// @params route'',validations[],callback function()
router.post(
  // ROUTE
  '/',
  // USER VALIDATIONS
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email')
      .isEmail(),
    check('password', 'Please enter a password with 6 or more characters')
      .isLength({ min: 6 })
  ],
  // CALLBACK FUNCTION
  async (req, res) => {
    // Handle Errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // Status 400: bad request
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        res.status(400).json({ errors: [{ msg: 'User already exists' }] })
      }
      res.send('User route');

    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server error'); // Status 500: Internal Server Error
    }
  }
);

module.exports = router;
