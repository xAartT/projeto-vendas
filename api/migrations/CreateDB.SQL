CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT
);

CREATE TABLE tokens (
    id SERIAL PRIMARY KEY NOT NULL,
    token_hash TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    criado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    valido_ate TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    device_info TEXT,
    CONSTRAINT token_to_usuarios_fk 
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE produtos (
    id SERIAL PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    imagem_url TEXT,
    vendedor_id INTEGER NOT NULL,
    CONSTRAINT produto_to_usuarios_fk 
        FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE TABLE produtos_favoritos (
    id SERIAL PRIMARY KEY NOT NULL,
    favoritado BOOLEAN NOT NULL DEFAULT TRUE,
    usuario_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    adicionado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT favorito_to_usuarios_fk 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,

    CONSTRAINT favorito_to_produtos_fk 
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE carrinho (
    id SERIAL PRIMARY KEY NOT NULL,
    usuario_id INTEGER NOT NULL,
    criado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT carrinho_to_usuarios_fk
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE carrinho_itens (
    id SERIAL PRIMARY KEY NOT NULL,
    carrinho_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    adicionado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT itens_to_carrinho_fk 
        FOREIGN KEY (carrinho_id) REFERENCES carrinho(id) ON DELETE CASCADE,

    CONSTRAINT itens_to_produtos_fk 
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE vendas (
    id SERIAL PRIMARY KEY NOT NULL,
    usuario_id INTEGER NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    vendido_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT venda_to_usuarios_fk 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE vendas_produtos (
    id SERIAL PRIMARY KEY NOT NULL,
    venda_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,

    CONSTRAINT venda_produto_to_vendas_fk 
        FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,

    CONSTRAINT venda_produto_to_produtos_fk 
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_token_hash ON tokens(token_hash);
CREATE INDEX idx_produto_vendedor ON produtos(vendedor_id);
CREATE INDEX idx_carrinho_usuario ON carrinho(usuario_id);
CREATE INDEX idx_carrinho_itens_prod ON carrinho_itens(produto_id);
CREATE INDEX idx_vendas_usuario ON vendas(usuario_id);
CREATE INDEX idx_vendas_prod_venda ON vendas_produtos(venda_id);
