const express = require('express');
const router = express.Router();
const produtosService = require('../services/produtos');

router.post('/create', async (req, res) => {
    try {
        const novoProduto = await produtosService.createProdutoAction(req.body);
        res.status(201).json(novoProduto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/createWithCsv', (req, res) => {
    res.status(501).json({ error: 'Not Implemented' });
});

router.get('/dashboardData', async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    try {
        const data = await produtosService.dashboardDataAction(userId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar dashboard.', msg: error.message });
    }
});

router.get('/getByVendedor', async (req, res) => {
    const vendedorId = req.query.vendedorId;

    if (!vendedorId) {
        return res.status(400).json({ error: 'vendedorId é obrigatório.' });
    }

    try {
        const produtos = await produtosService.getByVendedorAction(vendedorId);
        res.status(200).json(produtos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
});

router.post('/favoritar', async (req, res) => {
    const { userId, produtoId } = req.body;

    if (!userId || !produtoId) {
        return res.status(400).json({ error: 'userId e produtoId são obrigatórios.' });
    }

    try {
        const result = await produtosService.favoritarAction(userId, produtoId);
        res.status(200).json({
            message: 'Status atualizado com sucesso.',
            favoritado: result.favoritado
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao favoritar produto.' });
    }
});

module.exports = router;