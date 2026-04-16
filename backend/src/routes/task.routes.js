const express = require('express');
const taskController = require('../controllers/task.controller');
const verifyToken = require('../middlewares/verifyToken');

const router = express.Router();

router.patch('/:taskId', verifyToken, taskController.updateTask);
router.delete('/:taskId', verifyToken, taskController.deleteTask);

module.exports = router;
