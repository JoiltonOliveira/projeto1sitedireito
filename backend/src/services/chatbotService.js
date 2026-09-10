const { query } = require('../config/database');

const FAQ_RESPOSTAS = {
  prazo: 'O prazo varia conforme o tipo de demanda, mas normalmente a equipe analisa a solicitação e responde em seguida.',
  pagamento: 'A forma de pagamento pode ser discutida diretamente com a equipe após a qualificação do atendimento.',
  atendimento: 'O atendimento pode acontecer por WhatsApp ou pelo próprio canal do site, conforme a necessidade do cliente.',
  contato: 'Para continuar, vamos registrar seu nome e WhatsApp para que a equipe possa retornar com mais rapidez.',
  servico: 'Os serviços são adaptados à demanda do cliente; após o cadastro, a equipe confirma o melhor atendimento.',
};

function getBusinessHoursMessage() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  const isBusinessHours = day >= 1 && day <= 5 && hour >= 8 && hour < 18;

  return isBusinessHours
    ? 'Olá! Como posso ajudar hoje? Posso responder dúvidas, orientar sobre os serviços ou registrar seu contato.'
    : 'Olá! Nosso atendimento humano está fora do horário comercial, mas posso registrar seu pedido e te responder no próximo horário útil.';
}

function getRespostaFaq(mensagem) {
  const texto = (mensagem || '').toLowerCase().trim();

  if (!texto) {
    return null;
  }

  if (texto.includes('prazo') || texto.includes('tempo')) {
    return FAQ_RESPOSTAS.prazo;
  }

  if (texto.includes('pagamento') || texto.includes('valor') || texto.includes('preço')) {
    return FAQ_RESPOSTAS.pagamento;
  }

  if (texto.includes('atendimento') || texto.includes('retorno') || texto.includes('contato')) {
    return FAQ_RESPOSTAS.atendimento;
  }

  if (texto.includes('servico') || texto.includes('serviços') || texto.includes('ajuda')) {
    return FAQ_RESPOSTAS.servico;
  }

  return null;
}

async function processarMensagem(payload) {
  const {
    mensagem = '',
    nome = '',
    telefone = '',
    assunto = '',
    etapa = 'welcome',
  } = payload || {};

  const texto = String(mensagem || '').trim();
  const mensagemNormalizada = texto.toLowerCase();

  if (!texto && !nome && !telefone && !assunto && etapa === 'welcome') {
    return {
      response: getBusinessHoursMessage(),
      nextStep: 'menu',
      message: 'Mensagem processada com sucesso.',
    };
  }

  if (etapa === 'welcome' || etapa === 'menu') {
    if (['dúvidas', 'duvidas'].includes(mensagemNormalizada)) {
      return {
        response: 'Claro. Qual assunto você quer saber? Posso responder sobre prazo, atendimento, serviços e contato.',
        nextStep: 'faq',
        message: 'Menu de dúvidas apresentado.',
      };
    }

    if (['orçamento', 'orcamento'].includes(mensagemNormalizada)) {
      return {
        response: 'Ótimo. Para registrar seu orçamento, por favor, me diga seu nome.',
        nextStep: 'coleta_nome',
        pendingField: 'nome',
        message: 'Coleta de nome iniciada.',
      };
    }

    if (['falar com atendente', 'atendente', 'atendimento humano'].includes(mensagemNormalizada)) {
      return {
        response: 'Para encaminhar sua mensagem ao atendimento humano, por favor, me diga seu nome.',
        nextStep: 'coleta_nome',
        pendingField: 'nome',
        message: 'Coleta de nome iniciada.',
      };
    }

    const respostaFaq = getRespostaFaq(mensagemNormalizada);
    if (respostaFaq) {
      return {
        response: respostaFaq,
        nextStep: 'menu',
        message: 'Resposta de FAQ fornecida.',
      };
    }

    return {
      response: 'Escolha uma opção para continuar: Dúvidas, Orçamento ou Falar com atendente.',
      nextStep: 'menu',
      message: 'Menu inicial exibido.',
    };
  }

  if (etapa === 'faq') {
    const respostaFaq = getRespostaFaq(mensagemNormalizada);
    if (respostaFaq) {
      return {
        response: `${respostaFaq} Se preferir, posso também registrar seu contato para uma resposta mais direta.`,
        nextStep: 'menu',
        message: 'Resposta de FAQ respondida com encaminhamento opcional.',
      };
    }

    return {
      response: 'Posso responder sobre prazo, pagamento, atendimento e serviços. Você pode me mandar uma dessas palavras-chave.',
      nextStep: 'faq',
      message: 'Aguardando tema da dúvida.',
    };
  }

  if (etapa === 'coleta_nome') {
    if (!texto) {
      return {
        response: 'Por favor, me diga seu nome para continuar.',
        nextStep: 'coleta_nome',
        pendingField: 'nome',
        message: 'Nome obrigatório para continuar.',
      };
    }

    return {
      response: 'Obrigado. Agora, me diga seu telefone ou WhatsApp.',
      nextStep: 'coleta_telefone',
      pendingField: 'telefone',
      data: { nome: texto },
      message: 'Coleta de telefone iniciada.',
    };
  }

  if (etapa === 'coleta_telefone') {
    if (!texto) {
      return {
        response: 'Preciso do seu telefone ou WhatsApp para registrar o contato.',
        nextStep: 'coleta_telefone',
        pendingField: 'telefone',
        message: 'Telefone obrigatório para continuar.',
      };
    }

    return {
      response: 'Perfect. Para finalizar, digite o assunto da sua demanda.',
      nextStep: 'coleta_assunto',
      pendingField: 'assunto',
      data: { telefone: texto },
      message: 'Coleta de assunto iniciada.',
    };
  }

  if (etapa === 'coleta_assunto') {
    if (!texto) {
      return {
        response: 'Informe o assunto da sua demanda para finalizar o cadastro.',
        nextStep: 'coleta_assunto',
        pendingField: 'assunto',
        message: 'Assunto obrigatório para continuar.',
      };
    }

    const leadPayload = {
      nome: String(nome || '').trim(),
      telefone: String(telefone || '').trim(),
      assunto: texto,
      origem: 'chatbot',
      canal: 'chatbot',
    };

    if (!leadPayload.nome || !leadPayload.telefone || !leadPayload.assunto) {
      return {
        response: 'Faltam informações para registrar seu contato. Vamos começar de novo pelo nome.',
        nextStep: 'coleta_nome',
        pendingField: 'nome',
        message: 'Dados incompletos para salvar lead.',
      };
    }

    await query(
      `
        INSERT INTO leads (nome, telefone, assunto, origem, canal, status)
        VALUES ($1, $2, $3, 'chatbot', 'chatbot', 'novo')
      `,
      [leadPayload.nome, leadPayload.telefone, leadPayload.assunto]
    );

    return {
      response: 'Tudo certo! Seu contato foi registrado e nossa equipe irá responder no próximo horário útil.',
      nextStep: 'menu',
      message: 'Lead salvo com sucesso pelo chatbot.',
    };
  }

  return {
    response: 'Escolha uma opção para continuar: Dúvidas, Orçamento ou Falar com atendente.',
    nextStep: 'menu',
    message: 'Fluxo padrão do chatbot.',
  };
}

module.exports = {
  getBusinessHoursMessage,
  processarMensagem,
  getRespostaFaq,
};
