const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const widgetRoutes = require('./widget.routes');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');
const { coverUploadMiddleware } = require('../utils/uploads');

// Toutes les routes "groupes" nécessitent d'être connecté (verifyToken)
router.post('/', verifyToken, groupController.createGroup);
router.get('/', verifyToken, groupController.getGroups);
router.post('/join', verifyToken, groupController.joinGroup)
router.use('/:id/widgets', verifyToken, widgetRoutes);
router.get('/:id', verifyToken, groupController.getGroupById);
router.post('/:id/cover', verifyToken, checkRole(['ADMIN', 'EDITOR']), coverUploadMiddleware, groupController.uploadCover);
router.put('/:id/members/:userId', verifyToken, checkRole(['ADMIN']), groupController.updateMemberRole);
router.delete('/:id/members/:userId', verifyToken, checkRole(['ADMIN', 'EDITOR'], { allowSelf: true }), groupController.removeMember);
router.put('/:id/transfer', verifyToken, checkRole(['ADMIN'], { creatorOnly: true }), groupController.transferOwnership);
router.delete('/:id', verifyToken, checkRole(['ADMIN'], { creatorOnly: true }), groupController.deleteGroup);

module.exports = router;
