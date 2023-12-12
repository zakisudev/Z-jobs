const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for email or password
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Check if email is valid email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email');
  }

  // Find the user in the database
  const user = await User.findOne({ email });

  // Check if the user exists and the password matches
  if (user && (await user.matchPassword(password))) {
    // Send the user information and the token cookie
    generateToken(res, user._id);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    // Send an error message
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check for email, username, or password
  if (!email) {
    res.status(400);
    throw new Error('Please provide an email');
  }
  if (!username) {
    res.status(400);
    throw new Error('Please provide a username');
  }
  if (!password) {
    res.status(400);
    throw new Error('Please provide a password');
  }

  // Check if email is valid email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email');
  }

  // Check if password is at least 6 characters
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Check if the user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create the user
  const user = await User.create({
    username,
    email,
    password,
  });

  // Send the user information and the token cookie
  generateToken(res, user._id);

  res.status(201).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

// @desc    Log the user out
// @route   GET /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  // Remove the token cookie
  res.cookie('jwt', '', { expires: new Date(0) });

  // Send a success message
  res.status(200).json({ message: 'User logged out' });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  // Get the user from the database
  const user = await User.findById(req.user._id);

  // Check if the user exists
  if (user) {
    // Send the user information
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    // Send an error message
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  // Get the user from the database
  const user = await User.findById(req.user._id);

  // Check if the user exists
  if (user) {
    // Update the user information
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Save the updated user in the database
    const updatedUser = await user.save();

    // Send the updated user information and the token cookie
    generateToken(res, updatedUser._id);

    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    // Send an error message
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  // Get all users from the database
  const users = await User.find({});

  // Send the users information
  res.status(200).json(users);
});

// @desc    Get a user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  // Get the user from the database
  const user = await User.findById(req.params.id).select('-password');

  // Check if the user exists
  if (user) {
    // Send the user information
    res.status(200).json(user);
  } else {
    // Send an error message
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  // Get the user from the database
  const user = await User.findById(req.params.id);

  // Check if the user exists
  if (user) {
    // Update the user information
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin;

    // check for password change
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Save the updated user in the database
    const updatedUser = await user.save();

    // generate token and send it in a cookie
    generateToken(res, updatedUser._id);
    // Send the updated user information
    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    // Send an error message
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  // Get the user from the database
  const user = await User.findById(req.params.id);

  // Check if the user exists
  if (user) {
    // Remove the user from the database
    await user.remove();

    // Send a success message
    res.status(200).json({ message: 'User removed' });
  } else {
    // Send an error message
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
};
