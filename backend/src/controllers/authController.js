const { createSession, destroySession } = require('../middleware/auth');
const { timingSafeEqual, scryptSync } = require('node:crypto');

function getConfiguredPassword() {
  return process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || 'admin';
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

function comparePassword(password, targetPassword) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  if (!targetPassword || typeof targetPassword !== 'string') {
    return false;
  }

  if (targetPassword.startsWith('scrypt:')) {
    const [, salt, hash] = targetPassword.split(':');
    if (!salt || !hash) {
      return false;
    }

    const candidateHash = hashPassword(password, salt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(candidateHash, 'hex');

    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(a, b);
  }

  return password === targetPassword;
}

async function login(req, res) {
  try {
    const { password } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ ok: false, message: 'Senha é obrigatória.' });
    }

    const targetPassword = getConfiguredPassword();
    if (!comparePassword(password, targetPassword)) {
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
