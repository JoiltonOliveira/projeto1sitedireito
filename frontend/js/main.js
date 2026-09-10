const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

const buildApiUrl = (path) => `${apiBase}${path}`;

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const form = document.getElementById('lead-form');
  const chatbotToggle = document.getElementById('chatbot-toggle');
  const chatbotPanel = document.getElementById('chatbot-panel');
  const optionButtons = document.querySelectorAll('.option-btn');
  const chatbotMessages = document.getElementById('chatbot-messages');
  const chatbotForm = document.getElementById('chatbot-form');
  const chatbotInput = document.getElementById('chatbot-input');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const state = {
    etapa: 'welcome',
    nome: '',
    telefone: '',
    assunto: '',
    pendingField: null,
  };

  const appendMessage = (type, content) => {
    if (!chatbotMessages) {
      return;
    }

    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = content;
    chatbotMessages.appendChild(message);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  };

  const loadBotWelcomeMessage = async () => {
    if (!chatbotMessages) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/api/chatbot/welcome'));
      const result = await response.json();

      if (response.ok && result.message) {
        appendMessage('bot', result.message);
        state.etapa = 'menu';
      }
    } catch (error) {
      console.error('Erro ao carregar mensagem de boas-vindas:', error);
    }
  };

  const sendChatbotMessage = async (messageText) => {
    if (!messageText) {
      return;
    }

    appendMessage('user', messageText);

    try {
      const payload = {
        mensagem: messageText,
        etapa: state.etapa,
        nome: state.nome,
        telefone: state.telefone,
        assunto: state.assunto,
      };

      const response = await fetch(buildApiUrl('/api/chatbot/message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro no chatbot.');
      }

      if (result.response) {
        appendMessage('bot', result.response);
      }

      if (result.nextStep) {
        state.etapa = result.nextStep;
      }

      if (result.pendingField) {
        state.pendingField = result.pendingField;
      }

      if (result.data) {
        if (result.data.nome) {
          state.nome = result.data.nome;
        }

        if (result.data.telefone) {
          state.telefone = result.data.telefone;
        }
      }
    } catch (error) {
      console.error(error);
      appendMessage('bot', 'Não foi possível processar sua mensagem no momento.');
    }
  };

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = {
        nome: formData.get('nome')?.trim(),
        telefone: formData.get('telefone')?.trim(),
        assunto: formData.get('assunto')?.trim(),
        observacao: formData.get('observacao')?.trim(),
        origem: 'site',
        canal: 'site',
      };

      if (!payload.nome || !payload.telefone || !payload.assunto) {
        alert('Preencha nome, telefone e assunto para enviar sua mensagem.');
        return;
      }

      try {
        const response = await fetch(buildApiUrl('/api/leads'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Erro ao enviar formulário.');
        }

        alert(result.message || 'Contato enviado com sucesso!');
        form.reset();
      } catch (error) {
        console.error(error);
        alert(error.message || 'Não foi possível enviar o formulário.');
      }
    });
  }

  if (chatbotToggle && chatbotPanel) {
    chatbotToggle.addEventListener('click', () => {
      const isHidden = chatbotPanel.classList.toggle('hidden');
      chatbotToggle.setAttribute('aria-expanded', String(!isHidden));
    });
  }

  if (optionButtons.length) {
    optionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        sendChatbotMessage(button.dataset.option);
      });
    });
  }

  if (chatbotForm && chatbotInput) {
    chatbotForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const value = chatbotInput.value.trim();
      if (!value) {
        return;
      }

      const payload = value;
      chatbotInput.value = '';
      sendChatbotMessage(payload);
    });
  }

  loadBotWelcomeMessage();
});
