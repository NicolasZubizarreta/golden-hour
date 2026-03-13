const express = require('express');
const widgetController = require('../controllers/widget.controller');
const checkRole = require('../middlewares/checkRole');

const router = express.Router({ mergeParams: true });

router.get('/', checkRole(['ADMIN', 'EDITOR', 'MEMBER']), widgetController.getWidgets);
router.post('/', checkRole(['ADMIN', 'EDITOR']), widgetController.addWidget);
router.put('/reorder', checkRole(['ADMIN', 'EDITOR']), widgetController.reorderWidgets);
router.delete('/:widgetId', checkRole(['ADMIN', 'EDITOR']), widgetController.deleteWidget);

module.exports = router;
