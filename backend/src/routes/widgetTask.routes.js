const express = require('express');
const taskController = require('../controllers/task.controller');
const verifyToken = require('../middlewares/verifyToken');

const router = express.Router();

router.get('/:widgetId/tasks', verifyToken, taskController.getTasksByWidget);
router.post('/:widgetId/tasks', verifyToken, taskController.createTask);

module.exports = router;
