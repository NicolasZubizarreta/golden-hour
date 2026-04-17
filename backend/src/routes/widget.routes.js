const express = require('express');
const widgetController = require('../controllers/widget.controller');
const expenseRoutes = require('./expense.routes');
const checkRole = require('../middlewares/checkRole');

const router = express.Router({ mergeParams: true });

router.get('/', checkRole(['ADMIN', 'EDITOR', 'MEMBER']), widgetController.getWidgets);
router.post('/', checkRole(['ADMIN', 'EDITOR']), widgetController.addWidget);
router.put('/reorder', checkRole(['ADMIN', 'EDITOR']), widgetController.reorderWidgets);
router.put('/:widgetId', checkRole(['ADMIN', 'EDITOR']), widgetController.updateWidget);
router.delete('/:widgetId', checkRole(['ADMIN', 'EDITOR']), widgetController.deleteWidget);

// Routes dépenses (Tricount) — /api/groups/:id/widgets/:widgetId/expenses
router.use('/:widgetId/expenses', expenseRoutes);

module.exports = router;
