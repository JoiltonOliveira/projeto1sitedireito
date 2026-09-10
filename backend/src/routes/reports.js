const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/resumo', async (req, res) => {
  try {
    const totalLeads = await query('SELECT COUNT(*) AS total FROM leads');
    const porStatus = await query(
      'SELECT status, COUNT(*) AS total FROM leads GROUP BY status ORDER BY total DESC'
    );
    const porHora = await query(
      `
        SELECT EXTRACT(HOUR FROM criado_em) AS hora, COUNT(*) AS total
        FROM leads
        GROUP BY EXTRACT(HOUR FROM criado_em)
        ORDER BY hora ASC
      `
    );

    res.status(200).json({
      ok: true,
      data: {
        totalLeads: Number(totalLeads.rows[0].total),
        porStatus: porStatus.rows,
        porHora: porHora.rows,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      ok: false,
      message: 'Não foi possível gerar o relatório.',
    });
  }
});

module.exports = router;
