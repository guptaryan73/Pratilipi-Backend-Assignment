const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { produceMessage } = require('../kafka/producer');

/**
 * Generate JWT token for authentication
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Remove password from output
    newUser.password = undefined;

    // Generate token
    const token = signToken(newUser._id);

    // Emit "User Registered" event
    await produceMessage('user-events', {
      type: 'USER_REGISTERED',
      payload: {
        userId: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user'
    });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // If everything ok, send token to client
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to login'
    });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user profile'
    });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    // Filter out fields that are not allowed to be updated
    const filteredBody = {};
    const allowedFields = ['name', 'email'];

    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        filteredBody[field] = req.body[field];
      }
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    // Emit "User Profile Updated" event
    await produceMessage('user-events', {
      type: 'USER_PROFILE_UPDATED',
      payload: {
        userId: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        updatedAt: Date.now()
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user profile'
    });
  }
};

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get users'
    });
  }
};

/**
 * Get user by ID (admin only)
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user'
    });
  }
};