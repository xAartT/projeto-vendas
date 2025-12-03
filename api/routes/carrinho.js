const express = require('express');
const router = express.Router();
const carrinhoService = require('../services/carrinho');

router.post('/adicionar', async (req, res) => {
    const { produtoId, quantidade, userId, precoUnitario } = req.body;

    try {
        await carrinhoService.adicionarAction(produtoId, quantidade, userId, precoUnitario);

        res.status(200).json({ message: 'Produto adicionado ao carrinho com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar produto ao carrinho.' });
    }
});

router.post('/remover', async (req, res) => {
    const { produtoId, userId } = req.body;

    try {
        await carrinhoService.removerAction(produtoId, userId);

        res.status(200).json({ message: 'Produto removido do carrinho com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover produto do carrinho.' });
    }
});

router.post('/finalizar', async (req, res) => {
    const { userId } = req.body;

    try {
        await carrinhoService.finalizarAction(userId);

        res.status(200).json({ message: 'Compra finalizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao finalizar a compra.' });
    }
});

module.exports = router;
