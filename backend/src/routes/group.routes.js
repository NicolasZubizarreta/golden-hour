const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const verifyToken = require('../middlewares/verifyToken');

// Toutes les routes "groupes" nécessitent d'être connecté (verifyToken)
router.post('/', verifyToken, groupController.createGroup);
router.get('/', verifyToken, groupController.getGroups);
router.get('/:id', verifyToken, groupController.getGroupById);

module.exports = router;