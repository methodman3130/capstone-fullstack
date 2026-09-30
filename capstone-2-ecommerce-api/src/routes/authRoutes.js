const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register); // 201
router.post('/login', login); // 200
router.get('/me', protect, getMe); // 200, requires a valid token

module.exports = router;
