const pool = require('../db/pool');

module.exports = {
    createProdutoAction: async function (produto) {
        const { nome, preco, estoque, descricao, imagemUrl, vendedorId } = produto;

        if (!nome || !preco || !estoque || !descricao || !imagemUrl || !vendedorId) {
            throw new Error('Todos os campos são obrigatórios.');
        }

        const result = await pool.query(
            `
            INSERT INTO produtos 
            (nome, preco, estoque, descricao, imagem_url, vendedor_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            `,
            [nome, preco, estoque, descricao, imagemUrl, vendedorId]
        );

        return result.rows[0];
    },

    dashboardDataAction: async function (userId) {
        const result = await pool.query(
            `
                WITH vendas_do_vendedor AS (
                    SELECT 
                        v.id AS venda_id,
                        vp.produto_id,
                        vp.quantidade,
                        vp.preco_unitario
                    FROM vendas v
                    JOIN vendas_produtos vp ON vp.venda_id = v.id
                    JOIN produtos p ON p.id = vp.produto_id
                    WHERE p.vendedor_id = $1
                ),

                totais AS (
                    SELECT 
                        COALESCE(SUM(quantidade), 0) AS total_produtos_vendidos,
                        COALESCE(SUM(quantidade * preco_unitario), 0) AS faturamento_total
                    FROM vendas_do_vendedor
                ),

                mais_vendido AS (
                    SELECT 
                        produto_id,
                        SUM(quantidade) AS quantidade_total,
                        ROW_NUMBER() OVER (ORDER BY SUM(quantidade) DESC) AS rk
                    FROM vendas_do_vendedor
                    GROUP BY produto_id
                )

                SELECT 
                    t.total_produtos_vendidos,
                    t.faturamento_total,
                    p.id AS produto_mais_vendido_id,
                    p.nome AS produto_mais_vendido_nome,
                    mv.quantidade_total AS quantidade_produto_mais_vendido
                FROM totais t
                LEFT JOIN mais_vendido mv ON mv.rk = 1
                LEFT JOIN produtos p ON p.id = mv.produto_id;
            `,
            [userId]
        );

        return result.rows[0] || {};
    },

    getByVendedorAction: async function (vendedorId) {
        if (!vendedorId) {
            throw new Error('O id do vendedor é obrigatório.');
        }

        const result = await pool.query(
            'SELECT * FROM produtos WHERE vendedor_id = $1',
            [vendedorId]
        );

        return result.rows;
    },

    favoritarAction: async function (userId, produtoId) {
        if (!userId || !produtoId) {
            throw new Error('Usuário ou produto não especificado.');
        }

        const result = await pool.query(
            'SELECT * FROM produtos_favoritos WHERE usuario_id = $1 AND produto_id = $2',
            [userId, produtoId]
        );

        if (result.rows.length === 0) {
            await pool.query(
                `
                INSERT INTO produtos_favoritos 
                (usuario_id, produto_id, favoritado)
                VALUES ($1, $2, TRUE)
                `,
                [userId, produtoId]
            );
            return { favoritado: true };
        }

        const atual = result.rows[0].favoritado;
        const novoEstado = !atual;

        await pool.query(
            `
            UPDATE produtos_favoritos
            SET favoritado = $1
            WHERE usuario_id = $2 AND produto_id = $3
            `,
            [novoEstado, userId, produtoId]
        );

        return { favoritado: novoEstado };
    }
};
