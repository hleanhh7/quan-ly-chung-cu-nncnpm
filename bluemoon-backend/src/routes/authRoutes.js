const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Đường dẫn: POST /api/auth/register
router.post('/register', authController.register);

// Đường dẫn: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;