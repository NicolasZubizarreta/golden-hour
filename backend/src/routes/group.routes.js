const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

// Toutes les routes "groupes" nécessitent d'être connecté (verifyToken)
router.post('/', verifyToken, groupController.createGroup);
router.get('/', verifyToken, groupController.getGroups);
router.post('/join', verifyToken, groupController.joinGroup)
router.get('/:id', verifyToken, groupController.getGroupById);
router.put('/:id/members/:userId', verifyToken, checkRole(['ADMIN'], { onlyCreatorCanAssignAdmin: true }), groupController.updateMemberRole);
router.delete('/:id/members/:userId', verifyToken, checkRole(['ADMIN', 'EDITOR'], { allowSelf: true }), groupController.removeMember);

module.exports = router;
