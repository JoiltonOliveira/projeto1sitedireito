const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

router.get('/welcome', chatbotController.welcome);
router.post('/message', chatbotController.processarMensagem);

module.exports = router;
