const { createSession, destroySession } = require('../middleware/auth');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

async function login(req, res) {
  try {
    const { password } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ ok: false, message: 'Senha é obrigatória.' });
    }

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ ok: false, message: 'Senha inválida.' });
    }

    const sessionId = createSession();
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ ok: true, message: 'Login realizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ ok: false, message: 'Erro ao fazer login.' });
  }
}

async function logout(req, res) {
  try {
    const sessionId = req.cookies?.sessionId;

    if (sessionId) {
      destroySession(sessionId);
    }

    res.clearCookie('sessionId');
    return res.status(200).json({ ok: true, message: 'Logout realizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ ok: false, message: 'Erro ao fazer logout.' });
  }
}

module.exports = {
  login,
  logout,
};
