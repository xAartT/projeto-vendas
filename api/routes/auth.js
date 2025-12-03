const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const cookieParser = require('cookie-parser');

const {
  signAccess,
  signRefresh,
  verifyRefresh,
  hashToken,
  generateTokenId,
  REFRESH_EXP
} = require('../utils/jwt');

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const REFRESH_EXP_MS = (() => {
  return 30 * 24 * 60 * 60 * 1000;
})();

router.use(cookieParser());

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_EXP_MS,
    path: '/auth/refresh'
  };
}

router.post('/register', async (req, res) => {
  try {
    const { nome, email, password, tipo = 'user' } = req.body;
    if (!email || !password || !nome) return res.status(400).json({ error: 'dados incompletos' });

    const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists.rowCount) return res.status(400).json({ error: 'Usuário já existe' });

    const password_hash = await bcrypt.hash(password, 12);
    const r = await pool.query(
      'INSERT INTO usuarios (nome, tipo, email, password_hash) VALUES ($1,$2,$3,$4) RETURNING id,nome,tipo,email',
      [nome, tipo, email, password_hash]
    );
    return res.status(201).json({ user: r.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Dados incompletos' });

    const result = await pool.query('SELECT id, nome, tipo, password_hash FROM usuarios WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Credenciais inválidas' });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const tokenId = generateTokenId();
    const refresh = signRefresh(user, tokenId);
    const refreshHash = hashToken(refresh);
    const validoAte = new Date(Date.now() + REFRESH_EXP_MS);

    await pool.query(
      'INSERT INTO tokens (token_hash, user_id, criado_em, valido_ate, device_info) VALUES ($1,$2,NOW(),$3,$4)',
      [refreshHash, user.id, validoAte, deviceInfo || null]
    );

    const access = signAccess(user);

    res.cookie('refreshToken', refresh, cookieOptions());

    return res.json({ accessToken: access });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'No token' });

    let payload;
    try {
      payload = verifyRefresh(token);
    } catch (err) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const userId = payload.sub;
    const tokenHash = hashToken(token);

    const r = await pool.query('SELECT id, valido_ate FROM tokens WHERE token_hash = $1 AND user_id = $2', [tokenHash, userId]);
    if (r.rowCount === 0) {
      await pool.query('DELETE FROM tokens WHERE user_id = $1', [userId]);
      return res.status(401).json({ error: 'Refresh token não encontrado (revogado). Sessões encerradas.' });
    }

    const tokenRow = r.rows[0];
    if (new Date(tokenRow.valido_ate) < new Date()) {
      await pool.query('DELETE FROM tokens WHERE id = $1', [tokenRow.id]);
      return res.status(401).json({ error: 'Refresh token expirado' });
    }

    await pool.query('DELETE FROM tokens WHERE id = $1', [tokenRow.id]);

    const userRes = await pool.query('SELECT id, nome, tipo FROM usuarios WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

    const user = userRes.rows[0];
    const newTokenId = generateTokenId();
    const newRefresh = signRefresh(user, newTokenId);
    const newHash = hashToken(newRefresh);
    const newValidoAte = new Date(Date.now() + REFRESH_EXP_MS);

    await pool.query(
      'INSERT INTO tokens (token_hash, user_id, criado_em, valido_ate, device_info) VALUES ($1,$2,NOW(),$3,$4)',
      [newHash, user.id, newValidoAte, `rotated`]
    );

    const newAccess = signAccess(user);
    res.cookie('refreshToken', newRefresh, cookieOptions());
    return res.json({ accessToken: newAccess });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.json({ ok: true });

    let payload;
    try {
      payload = verifyRefresh(token);
    } catch (err) {
      res.clearCookie('refreshToken', { path: '/auth/refresh' });
      return res.json({ ok: true });
    }

    const tokenHash = hashToken(token);
    await pool.query('DELETE FROM tokens WHERE token_hash = $1', [tokenHash]);

    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/logoutAll', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2) return res.status(401).json({ error: 'Formato inválido' });

    const access = parts[1];
    const jwt = require('jsonwebtoken');
    let payload;
    try {
      payload = jwt.decode(access);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (!payload || !payload.sub) return res.status(401).json({ error: 'Token inválido' });

    await pool.query('DELETE FROM tokens WHERE user_id = $1', [payload.sub]);
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
