const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes (require authentication)
router.use(authMiddleware.protect);
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);

// Admin only routes
router.use(authMiddleware.restrictTo('admin'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

module.exports = router;