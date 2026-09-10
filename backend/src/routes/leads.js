const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { validateLeadPayload } = require('../middleware/validate');

router.get('/', leadController.listarLeads);
router.post('/', validateLeadPayload, leadController.criarLead);
router.patch('/:id/status', leadController.atualizarStatusLead);

module.exports = router;
