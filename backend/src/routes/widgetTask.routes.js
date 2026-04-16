const express = require('express');
const taskController = require('../controllers/task.controller');
const eventController = require('../controllers/event.controller');
const verifyToken = require('../middlewares/verifyToken');

const router = express.Router();

router.get('/:widgetId/tasks', verifyToken, taskController.getTasksByWidget);
router.post('/:widgetId/tasks', verifyToken, taskController.createTask);

router.get('/:widgetId/events', verifyToken, eventController.getEventsByWidget);
router.post('/:widgetId/events', verifyToken, eventController.createEvent);

module.exports = router;
