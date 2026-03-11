const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/verifyToken');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me
router.get('/me', verifyToken, authController.me);

// Demander une réinitialisation de mot de passe (Génère le token)
router.post('/forgot-password', authController.forgotPassword);

// Valider le nouveau mot de passe avec le token
router.post('/reset-password', authController.resetPassword);

module.exports = router;
