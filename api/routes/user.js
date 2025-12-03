const express = require('express');
const router = express.Router();
const userService = require('../services/user');

router.delete('/delete', async (req, res) => {
    const userId = req.body.id;

    if (!userId) {
        return res.status(400).json({ error: 'O campo id é obrigatório.' });
    }

    try {
        const result = await userService.deleteUserAction(userId);

        return res.status(200).json({
            message: 'Usuário deletado com sucesso.',
            result
        });

    } catch (err) {
        if (err.message === 'Usuário não encontrado') {
            return res.status(404).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Erro interno: ' + err.message });
    }
});

module.exports = router;