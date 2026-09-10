const { query } = require('../config/database');
const memoryStore = require('../config/memoryStore');

const statusPermitido = ['novo', 'em_atendimento', 'finalizado'];

function validarLead(payload) {
  const { nome, telefone, assunto } = payload || {};

  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return 'Nome é obrigatório.';
  }

  if (!telefone || typeof telefone !== 'string' || !telefone.trim()) {
    return 'Telefone é obrigatório.';
  }

  if (!assunto || typeof assunto !== 'string' || !assunto.trim()) {
    return 'Assunto é obrigatório.';
  }

  return null;
}

async function listarLeads() {
  const result = await query('SELECT * FROM leads ORDER BY criado_em DESC');
  return result.rows;
}

async function criarLead(payload) {
  const erro = validarLead(payload);
  if (erro) {
    throw new Error(erro);
  }

  const { nome, telefone, assunto, origem = 'site', canal = 'site', horarioPreferido, observacao } = payload;

  const result = await query(
    `
      INSERT INTO leads (nome, telefone, assunto, origem, canal, horario_preferido, observacao, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'novo')
      RETURNING *
    `,
    [nome.trim(), telefone.trim(), assunto.trim(), origem, canal, horarioPreferido || null, observacao || null]
  );

  const lead = result.rows?.[0] || memoryStore.createLead({
    nome: nome.trim(),
    telefone: telefone.trim(),
    assunto: assunto.trim(),
    origem,
    canal,
    horario_preferido: horarioPreferido || null,
    observacao: observacao || null,
    status: 'novo',
  });

  return lead;
}

async function atualizarStatusLead(id, status) {
  if (!statusPermitido.includes(status)) {
    throw new Error('Status inválido. Valores permitidos: novo, em_atendimento, finalizado.');
  }

  const result = await query(
    'UPDATE leads SET status = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (result.rowCount === 0) {
    const error = new Error('Lead não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  listarLeads,
  criarLead,
  atualizarStatusLead,
  validarLead,
};
