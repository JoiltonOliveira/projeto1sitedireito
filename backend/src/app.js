const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const leadRoutes = require('./routes/leads');
const chatbotRoutes = require('./routes/chatbot');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const { requireAuth } = require('./middleware/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/relatorios', reportRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Sistema de atendimento online em funcionamento.',
    timestamp: new Date().toISOString(),
  });
});

app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets')));
app.use('/css', express.static(path.join(__dirname, '../../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../../frontend/js')));
app.use('/pages', express.static(path.join(__dirname, '../../frontend/pages')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pages/login.html'));
});

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pages/admin.html'));
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    ok: false,
    message: 'Erro interno do servidor.',
  });
});

module.exports = app;

