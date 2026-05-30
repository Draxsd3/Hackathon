-- Seed de livros classicos para iniciar o acervo

INSERT INTO books (title, author, isbn, category, rfid, copy_code, course, discipline, location, row_code, shelf, copies, available) VALUES
    ('Dom Casmurro',                                 'Machado de Assis',           '9788535910658', 'Literatura Brasileira', 'RFID-LIT-0001', 'LIT-001-A', 'Ensino Medio', 'Literatura', 'A1-01', 'A1', '01', 3, 3),
    ('O Pequeno Principe',                           'Antoine de Saint-Exupery',   '9788574068008', 'Infanto-juvenil',       'RFID-INF-0002', 'INF-002-A', 'Ensino Medio', 'Literatura', 'A1-02', 'A1', '02', 5, 5),
    ('Vidas Secas',                                  'Graciliano Ramos',           '9788501405814', 'Literatura Brasileira', 'RFID-LIT-0003', 'LIT-003-A', 'Ensino Medio', 'Literatura', 'A1-03', 'A1', '03', 2, 2),
    ('A Revolucao dos Bichos',                       'George Orwell',              '9788535909555', 'Ficcao',                'RFID-FIC-0004', 'FIC-004-A', 'Ensino Medio', 'Literatura', 'B1-01', 'B1', '01', 4, 4),
    ('1984',                                         'George Orwell',              '9788535914849', 'Ficcao',                'RFID-FIC-0005', 'FIC-005-A', 'Ensino Medio', 'Literatura', 'B1-02', 'B1', '02', 3, 3),
    ('Capitaes da Areia',                            'Jorge Amado',                '9788535914832', 'Literatura Brasileira', 'RFID-LIT-0006', 'LIT-006-A', 'Ensino Medio', 'Literatura', 'B1-03', 'B1', '03', 2, 2),
    ('Memorias Postumas de Bras Cubas',              'Machado de Assis',           '9788535910641', 'Literatura Brasileira', 'RFID-LIT-0007', 'LIT-007-A', 'Ensino Medio', 'Literatura', 'C1-01', 'C1', '01', 2, 2),
    ('O Cortico',                                    'Aluisio Azevedo',            '9788508133086', 'Literatura Brasileira', 'RFID-LIT-0008', 'LIT-008-A', 'Ensino Medio', 'Literatura', 'C1-02', 'C1', '02', 2, 2),
    ('O Senhor dos Aneis: A Sociedade do Anel',      'J.R.R. Tolkien',             '9788595084759', 'Fantasia',              'RFID-FAN-0009', 'FAN-009-A', 'Ensino Medio', 'Literatura', 'D1-01', 'D1', '01', 2, 2),
    ('Harry Potter e a Pedra Filosofal',             'J.K. Rowling',               '9788532530783', 'Fantasia',              'RFID-FAN-0010', 'FAN-010-A', 'Ensino Medio', 'Literatura', 'D1-02', 'D1', '02', 4, 4)
ON CONFLICT DO NOTHING;
