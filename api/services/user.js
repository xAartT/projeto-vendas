const pool = require('../db/pool');

module.exports = {
    deleteUserAction: async function (userId) {
    if (!userId) {
        throw new Error("userId é obrigatório.");
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const user = await client.query(
            'SELECT * FROM usuarios WHERE id = $1',
            [userId]
        );

        if (user.rows.length === 0) {
            throw new Error('Usuário não encontrado');
        }

        await client.query(
            'DELETE FROM produtos_favoritos WHERE usuario_id = $1',
            [userId]
        );

        await client.query(
            `DELETE FROM carrinho_itens 
             WHERE carrinho_id IN (
                SELECT id FROM carrinho WHERE usuario_id = $1
             )`,
            [userId]
        );

        await client.query(
            'DELETE FROM carrinho WHERE usuario_id = $1',
            [userId]
        );

        await client.query(
            'DELETE FROM vendas WHERE usuario_id = $1',
            [userId]
        );

        await client.query(
            'DELETE FROM produtos WHERE vendedor_id = $1',
            [userId]
        );

        await client.query(
            'DELETE FROM tokens WHERE user_id = $1',
            [userId]
        );

        await client.query(
            'DELETE FROM usuarios WHERE id = $1',
            [userId]
        );

        await client.query('COMMIT');

        return { success: true, message: "Usuário removido com sucesso." };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

};
