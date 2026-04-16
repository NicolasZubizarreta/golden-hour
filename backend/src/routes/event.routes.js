const express = require('express');
const eventController = require('../controllers/event.controller');
const verifyToken = require('../middlewares/verifyToken');

const router = express.Router();

router.patch('/:eventId', verifyToken, eventController.updateEvent);
router.delete('/:eventId', verifyToken, eventController.deleteEvent);

module.exports = router;
