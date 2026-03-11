const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middlewares/verifyToken');

// Toutes ces routes nécessitent d'être connecté
router.put('/me', verifyToken, userController.updateProfile);
router.put('/me/password', verifyToken, userController.updatePassword);
router.delete('/me', verifyToken, userController.deleteAccount);

module.exports = router;