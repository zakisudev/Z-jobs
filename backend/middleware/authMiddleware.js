const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.jwt;
  // Check if token exists and starts with Bearer
  if (token) {
    try {
      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id from decoded token
      req.user = await User.findById(decoded.userId).select('-password');

      // Call next middleware
      next();
    } catch (error) {
      // Return error if token is invalid
      res.status(401);
      throw new Error('Unauthorized access, invalid token');
    }
  } else {
    res.status(401);
    throw new Error('Unauthorized access, no token');
  }
});

const admin = (req, res, next) => {
  // Check if user is admin
  if (req.user && req.user.isAdmin) {
    // Call next middleware
    next();
  } else {
    res.status(401);
    throw new Error('Unauthorized access, not an admin');
  }
};

module.exports = { protect, admin };
