// utils/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXP = process.env.ACCESS_TOKEN_EXP || '15m';
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXP || '30d';

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, tipo: user.tipo },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXP }
  );
}

function signRefresh(user, tokenId) {
  return jwt.sign(
    { sub: user.id, tid: tokenId },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXP }
  );
}

function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateTokenId() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
  hashToken,
  generateTokenId,
  REFRESH_EXP
};
