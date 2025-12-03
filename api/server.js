require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const requireAuth = require('./middlewares/auth');

const app = express();
app.use(helmet());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/usuarios', requireAuth, require('./routes/user'));
app.use('/produtos', requireAuth, require('./routes/produtos'));
app.use('/carrinho', requireAuth, require('./routes/carrinho'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta: ${PORT}`));
