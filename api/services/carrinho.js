const pool = require('../db/pool');

module.exports = {
    adicionarAction: async (produtoId, quantidade, userId, precoUnitario) => {
        const carrinho = await pool.query(
            'SELECT id FROM carrinho WHERE usuario_id = $1 LIMIT 1',
            [userId]
        );

        let carrinhoId = carrinho.rows.length > 0
            ? carrinho.rows[0].id
            : (await pool.query(
                'INSERT INTO carrinho (usuario_id) VALUES ($1) RETURNING id',
                [userId]
            )).rows[0].id;

        await pool.query(
            `INSERT INTO carrinho_itens (carrinho_id, produto_id, quantidade, preco_unitario)
             VALUES ($1, $2, $3, $4)`,
            [carrinhoId, produtoId, quantidade, precoUnitario]
        );
    },

        removerAction: async (produtoId, userId) => {
        const carrinho = await pool.query(
            'SELECT id FROM carrinho WHERE usuario_id = $1',
            [userId]
        );

        if (carrinho.rows.length === 0) return;

        await pool.query(
            'DELETE FROM carrinho_itens WHERE carrinho_id = $1 AND produto_id = $2',
            [carrinho.rows[0].id, produtoId]
        );
    },

        finalizarAction: async (userId) => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const carrinho = await client.query(
                `SELECT c.id as carrinho_id, ci.id AS item_id, ci.produto_id, ci.quantidade, ci.preco_unitario
                 FROM carrinho c
                 JOIN carrinho_itens ci ON ci.carrinho_id = c.id
                 WHERE c.usuario_id = $1`,
                [userId]
            );

            if (carrinho.rows.length === 0) {
                throw new Error('Carrinho vazio');
            }

            const venda = await client.query(
                `INSERT INTO vendas (usuario_id, total) 
                 VALUES ($1, 0) RETURNING id`,
                [userId]
            );

            const vendaId = venda.rows[0].id;
            let total = 0;

            for (const item of carrinho.rows) {
                await client.query(
                    `INSERT INTO vendas_produtos 
                        (venda_id, produto_id, quantidade, preco_unitario)
                     VALUES ($1, $2, $3, $4)`,
                    [vendaId, item.produto_id, item.quantidade, item.preco_unitario]
                );

                total += item.quantidade * item.preco_unitario;
            }

            await client.query(
                `UPDATE vendas SET total = $1 WHERE id = $2`,
                [total, vendaId]
            );

            await client.query(
                `DELETE FROM carrinho_itens WHERE carrinho_id = $1`,
                [carrinho.rows[0].carrinho_id]
            );

            await client.query(
                `DELETE FROM carrinho WHERE usuario_id = $1`,
                [userId]
            );

            await client.query('COMMIT');
            return { vendaId, total };

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
};