function validateLeadPayload(req, res, next) {
  const { nome, telefone, assunto } = req.body || {};

  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return res.status(400).json({ ok: false, message: 'Nome é obrigatório.' });
  }

  if (!telefone || typeof telefone !== 'string' || !telefone.trim()) {
    return res.status(400).json({ ok: false, message: 'Telefone é obrigatório.' });
  }

  if (!assunto || typeof assunto !== 'string' || !assunto.trim()) {
    return res.status(400).json({ ok: false, message: 'Assunto é obrigatório.' });
  }

  next();
}

module.exports = {
  validateLeadPayload,
};
