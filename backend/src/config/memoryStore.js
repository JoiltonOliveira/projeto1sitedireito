const leads = [];
let nextLeadId = 1;

function normalizeLead(lead) {
  const createdAt = lead.criado_em || lead.createdAt || new Date().toISOString();
  const updatedAt = lead.atualizado_em || lead.updatedAt || createdAt;

  return {
    id: Number(lead.id ?? nextLeadId++),
    nome: String(lead.nome || '').trim(),
    telefone: String(lead.telefone || '').trim(),
    assunto: String(lead.assunto || '').trim(),
    origem: lead.origem || 'site',
    status: lead.status || 'novo',
    horario_preferido: lead.horario_preferido || null,
    observacao: lead.observacao || null,
    canal: lead.canal || 'site',
    criado_em: createdAt,
    atualizado_em: updatedAt,
  };
}

function listLeads() {
  return [...leads]
    .map((lead) => normalizeLead(lead))
    .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
}

function createLead(payload) {
  const lead = normalizeLead({
    id: nextLeadId++,
    ...payload,
    status: payload.status || 'novo',
    origem: payload.origem || 'site',
    canal: payload.canal || 'site',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  });

  leads.push(lead);
  return lead;
}

function updateLeadStatus(id, status) {
  const index = leads.findIndex((lead) => Number(lead.id) === Number(id));

  if (index === -1) {
    const error = new Error('Lead não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const updatedLead = normalizeLead({
    ...leads[index],
    status,
    atualizado_em: new Date().toISOString(),
  });

  leads[index] = updatedLead;
  return updatedLead;
}

function getLeadSummary() {
  const totalLeads = leads.length;

  const statusMap = {
    novo: 0,
    em_atendimento: 0,
    finalizado: 0,
  };

  leads.forEach((lead) => {
    const status = lead.status || 'novo';
    if (statusMap[status] !== undefined) {
      statusMap[status] += 1;
    }
  });

  const porHora = Array.from({ length: 24 }, (_, hour) => ({
    hora: hour,
    total: 0,
  }));

  leads.forEach((lead) => {
    const date = new Date(lead.criado_em || lead.createdAt || Date.now());
    const hour = Number(date.getHours());
    if (Number.isInteger(hour) && hour >= 0 && hour < 24) {
      porHora[hour].total += 1;
    }
  });

  return {
    totalLeads,
    porStatus: Object.entries(statusMap).map(([status, total]) => ({ status, total })),
    porHora,
  };
}

module.exports = {
  listLeads,
  createLead,
  updateLeadStatus,
  getLeadSummary,
};
