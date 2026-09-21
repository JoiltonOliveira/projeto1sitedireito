const { Pool } = require('pg');
const memoryStore = require('./memoryStore');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:joiltondev@localhost:5432/atendimento_digital';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function buildDatabaseUnavailableError() {
  const error = new Error(
    'Banco de dados indisponível. Configure DATABASE_URL corretamente e verifique se o PostgreSQL está ativo.'
  );
  error.statusCode = 503;
  return error;
}

async function query(text, params) {
  const canUseMemoryFallback = process.env.ALLOW_MEMORY_FALLBACK !== 'false';

  try {
    const client = await pool.connect();

    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  } catch (error) {
    if (!canUseMemoryFallback) {
      throw buildDatabaseUnavailableError();
    }

    if (text.toLowerCase().includes('insert into leads') || text.toLowerCase().includes('select * from leads')) {
      return {
        rows: text.toLowerCase().includes('insert into leads')
          ? [memoryStore.createLead({
              nome: params?.[0],
              telefone: params?.[1],
              assunto: params?.[2],
              origem: params?.[3] || 'site',
              canal: params?.[4] || 'site',
              status: 'novo',
            })]
          : memoryStore.listLeads(),
      };
    }

    if (text.toLowerCase().includes('update leads set status')) {
      const [, id] = text.match(/where id = \$2/i) ? [null, params?.[1]] : [null, params?.[1]];
      const lead = memoryStore.updateLeadStatus(id, params?.[0]);
      return { rowCount: 1, rows: [lead] };
    }

    if (text.toLowerCase().includes('select count(*) as total from leads')) {
      return { rows: [{ total: memoryStore.getLeadSummary().totalLeads }] };
    }

    if (text.toLowerCase().includes('select status, count(*) as total from leads')) {
      return { rows: memoryStore.getLeadSummary().porStatus };
    }

    if (text.toLowerCase().includes('select extract(hour from criado_em)')) {
      return { rows: memoryStore.getLeadSummary().porHora.map((hour) => ({
        hora: hour.hora,
        total: hour.total,
      })) };
    }

    throw error;
  }
}

module.exports = {
  pool,
  query,
};
