# Sistema de Atendimento Digital

Este projeto é um MVP de site institucional com chatbot, gestão de leads e estrutura para integração com WhatsApp e relatórios básicos.

## Stack inicial

- Front-end: HTML5, CSS3 e JavaScript puro
- Back-end: Node.js + Express
- Banco: PostgreSQL

## Estrutura

- `frontend/` — páginas e assets do site
- `backend/` — API e lógica de negócio
- `database/` — scripts SQL e migrações

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```
3. Acesse:
   ```bash
   http://localhost:3000
   ```

## Observações

- O projeto está em etapa inicial de estruturação.
- O banco de dados deve ser configurado conforme o ambiente local ou de produção.
- O fallback em memória é permitido apenas para ambiente de demonstração e pode ser desligado com `ALLOW_MEMORY_FALLBACK=false`.
- Para uso real, o PostgreSQL deve estar ativo e a variável `DATABASE_URL` precisa apontar para o banco correto.
