// middlewares/auth.js
const { verifyAccess } = require('../utils/jwt');
const pool = require('../db/pool');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Formato inválido' });

  const token = parts[1];
  try {
    const payload = verifyAccess(token);
    const result = await pool.query('SELECT id, nome, tipo FROM usuarios WHERE id = $1', [payload.sub]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido/expirado' });
  }
}

module.exports = requireAuth;
