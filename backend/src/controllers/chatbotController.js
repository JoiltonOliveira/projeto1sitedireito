const chatbotService = require('../services/chatbotService');

function welcome(req, res) {
  res.status(200).json({
    ok: true,
    message: chatbotService.getBusinessHoursMessage(),
    options: ['Dúvidas', 'Orçamento', 'Falar com atendente'],
  });
}

async function processarMensagem(req, res) {
  try {
    const result = await chatbotService.processarMensagem(req.body);
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error('Erro ao processar mensagem do chatbot:', error);
    res.status(400).json({ ok: false, message: error.message || 'Não foi possível processar a mensagem do chatbot.' });
  }
}

module.exports = {
  welcome,
  processarMensagem,
};
