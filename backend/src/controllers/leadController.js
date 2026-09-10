const leadService = require('../services/leadService');

async function listarLeads(req, res) {
  try {
    const leads = await leadService.listarLeads();
    res.status(200).json({ ok: true, data: leads });
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    res.status(500).json({ ok: false, message: 'Não foi possível listar os leads.' });
  }
}

async function criarLead(req, res) {
  try {
    const lead = await leadService.criarLead(req.body);
    res.status(201).json({ ok: true, data: lead, message: 'Lead registrado com sucesso.' });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    const statusCode = error.message === 'Lead não encontrado.' ? 404 : 400;
    res.status(statusCode).json({ ok: false, message: error.message || 'Não foi possível registrar o lead.' });
  }
}

async function atualizarStatusLead(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const lead = await leadService.atualizarStatusLead(id, status);
    res.status(200).json({ ok: true, data: lead, message: 'Status do lead atualizado.' });
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ ok: false, message: error.message || 'Não foi possível atualizar o status do lead.' });
  }
}

module.exports = {
  listarLeads,
  criarLead,
  atualizarStatusLead,
};
