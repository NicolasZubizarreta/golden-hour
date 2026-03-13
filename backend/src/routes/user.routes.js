const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middlewares/verifyToken');
const { avatarUploadMiddleware } = require('../utils/uploads');

// Toutes ces routes nécessitent d'être connecté
router.put('/me', verifyToken, userController.updateProfile);
router.put('/me/password', verifyToken, userController.updatePassword);
router.post('/me/avatar', verifyToken, avatarUploadMiddleware, userController.uploadAvatar);
router.delete('/me', verifyToken, userController.deleteAccount);

module.exports = router;
