const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');

// Registration with OTP
router.post('/send-registration-otp', authController.sendRegistrationOTP);
router.post('/verify-registration-otp', authController.verifyRegistrationOTP);

// Login with OTP
router.post('/send-login-otp', authController.sendLoginOTP);
router.post('/verify-login-otp', authController.verifyLoginOTP);

// OAuth routes
router.get('/google/url', oauthController.getGoogleAuthUrl);
router.get('/google/callback', oauthController.googleCallback);

// Keep old endpoints for backward compatibility (optional - can remove later)
// router.post('/signup', authController.signup);
// router.post('/login', authController.login);

module.exports = router;
