-- Seed de livros classicos para iniciar o acervo

INSERT INTO books (title, author, isbn, category, copies, available) VALUES
    ('Dom Casmurro',                                 'Machado de Assis',           '9788535910658', 'Literatura Brasileira', 3, 3),
    ('O Pequeno Principe',                           'Antoine de Saint-Exupery',   '9788574068008', 'Infanto-juvenil',       5, 5),
    ('Vidas Secas',                                  'Graciliano Ramos',           '9788501405814', 'Literatura Brasileira', 2, 2),
    ('A Revolucao dos Bichos',                       'George Orwell',              '9788535909555', 'Ficcao',                4, 4),
    ('1984',                                         'George Orwell',              '9788535914849', 'Ficcao',                3, 3),
    ('Capitaes da Areia',                            'Jorge Amado',                '9788535914832', 'Literatura Brasileira', 2, 2),
    ('Memorias Postumas de Bras Cubas',              'Machado de Assis',           '9788535910641', 'Literatura Brasileira', 2, 2),
    ('O Cortico',                                    'Aluisio Azevedo',            '9788508133086', 'Literatura Brasileira', 2, 2),
    ('O Senhor dos Aneis: A Sociedade do Anel',      'J.R.R. Tolkien',             '9788595084759', 'Fantasia',              2, 2),
    ('Harry Potter e a Pedra Filosofal',             'J.K. Rowling',               '9788532530783', 'Fantasia',              4, 4)
ON CONFLICT (isbn) DO NOTHING;
