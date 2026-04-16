const express = require('express');
const expenseController = require('../controllers/expense.controller');
const checkRole = require('../middlewares/checkRole');

// mergeParams : hérite des params de la route parente (:id = groupId, :widgetId)
const router = express.Router({ mergeParams: true });

router.get('/', checkRole(['ADMIN', 'EDITOR', 'MEMBER']), expenseController.getExpenses);
router.post('/', checkRole(['ADMIN', 'EDITOR', 'MEMBER']), expenseController.addExpense);
router.post('/settle', checkRole(['ADMIN', 'EDITOR', 'MEMBER']), expenseController.settleDebt);
router.patch('/:expenseId', checkRole(['ADMIN', 'EDITOR', 'MEMBER']), expenseController.updateExpense);
router.delete('/:expenseId', checkRole(['ADMIN', 'EDITOR', 'MEMBER']), expenseController.deleteExpense);

module.exports = router;
