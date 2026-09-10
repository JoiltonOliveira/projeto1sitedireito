const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function createSession() {
  const sessionId = generateSessionId();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  sessions.set(sessionId, { expiresAt });
  return sessionId;
}

function isSessionValid(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    return false;
  }

  const session = sessions.get(sessionId);
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return false;
  }

  return true;
}

function destroySession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

function requireAuth(req, res, next) {
  const sessionId = req.cookies?.sessionId;

  if (!isSessionValid(sessionId)) {
    if (req.accepts('html')) {
      return res.redirect('/login');
    }

    return res.status(401).json({ ok: false, message: 'Acesso não autorizado. Faça login para continuar.' });
  }

  next();
}

module.exports = {
  createSession,
  isSessionValid,
  destroySession,
  requireAuth,
};
