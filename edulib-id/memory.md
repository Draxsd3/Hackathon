# Project Memory - Edulib-ID

## Objetivo

Edulib-ID agora e uma plataforma corporativa para gestao de biblioteca escolar. A experiencia visual segue um padrao institucional inspirado no Conecta: topo vermelho, sidebar fixa azul-petroleo, area de trabalho clara, cards executivos, tabelas densas e modulos operacionais.

## Arquitetura Atual

- `frontend/`: SPA React + Vite. As telas usam services em `frontend/src/services`.
- `student-portal/`: portal separado do aluno, inspirado no Conecta, servido em outra porta por `node student-portal/server.js`.
- `backend/`: API Express em Node.js. Rotas REST ficam em `backend/src/routes`, controllers em `backend/src/controllers` e regras de negocio em `backend/src/services`.
- `database/`: schemas SQL e seeds do banco real.
- `docs/`: arquitetura, contratos REST e regras de negocio.

A experiencia principal do frontend fica em `frontend/src/pages/Platform/index.jsx`. O roteador aponta para essa plataforma e qualquer URL volta para `/`. A tela antiga `TimeClock` fica como referencia historica, mas nao e a rota principal.

Modulos ativos no frontend:

- Dashboard
- Operacao
- Biblioteca, com dropdown unico para Acervo, Monitoramento, Agendamentos e Auditoria
- Alunos
- Relatorios
- Configuracoes

Regras atuais de UX:

- Sidebar curta, sem scroll em resolucoes comuns de notebook.
- Evitar aparencia futurista, neon, glow, linguagem de IA e excesso de graficos.
- Biblioteca/Acervo concentra uma consulta simples e responsiva de livros, localizacao e vinculacao RFID.
- Biblioteca/Monitoramento mostra quais alunos estao com determinados livros, com busca por livro, aluno, RA, turma ou RFID.
- Biblioteca/Agendamentos controla reservas de estudo para apenas duas salas disponiveis, com criacao manual, agenda do dia, filtros, confirmacao, cancelamento, conclusao e uso das salas.
- Portal do aluno: manter visual simples; agendamento de estudo abre por botao em modal, o aluno escolhe apenas Biblioteca ou MAKER e depois visualiza os horarios disponiveis da sala escolhida.
- Telas de agendamento devem evitar excesso de cards, graficos e textos explicativos; priorizar lista, agenda disponivel e acao principal.
- Escopo atual do MVP EduLib ID: controlar movimentacao de livros com FaceID + RFID. Sidebar principal deve ficar apenas com Dashboard, Operacao, Acervo, Alunos, Relatorios e Configuracoes.
- A plataforma principal deve consumir dados da API/backend por padrao. Nao exibir numeros inventados, graficos mockados ou fallbacks ficticios; quando a API nao retornar dados, usar estados vazios.
- Dashboard operacional deve responder: alunos presentes, livros disponiveis, livros emprestados, emprestimos ativos, ultimas movimentacoes e quem esta com cada livro.
- Operacao deve concentrar entrada por FaceID, saida por FaceID + RFID, criacao de emprestimos e devolucao por RFID.
- Alunos no MVP: cadastro deve ir pelo backend com RA, nome, curso, foto capturada e `faceDescriptor` gerado por `face-api.js`; alunos existentes podem atualizar o FaceID pela tela de Alunos.
- Biblioteca/Auditoria concentra a conferencia RFID do acervo fisico contra o cadastro.
- Alunos deve listar com botao de olho para abrir dados completos e alertar FaceID pendente/desatualizado.
- Relatorios deve ser mais completo que o dashboard, com filtros, indicadores, ranking de livros, frequencia e permanencia.
- Dashboard e Relatorios usam graficos visuais em SVG/CSS, incluindo pizza, rosca, teia/radar e linha/area, sem dependencia externa de charts.

## Persistencia

O MVP nasceu com `localStorage` no frontend e store em memoria no backend. A integracao com Supabase deve passar pelo backend Express usando Postgres, para evitar expor credenciais sensiveis no navegador.

Variaveis importantes:

- Backend: `DATABASE_URL` aponta para o Postgres/Supabase.
- Backend: `DATABASE_SSL=true` em Supabase, `false` para Postgres local sem SSL.
- Backend: `DATA_PROVIDER=postgres` usa conexao direta via `pg`.
- Backend: `DATA_PROVIDER=supabase-rest` usa a Data API HTTPS do Supabase quando a rede local bloqueia as portas PostgreSQL/Supavisor. Neste modo configurar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e, se o DNS local falhar, `SUPABASE_DNS_SERVERS=8.8.8.8,1.1.1.1`.
- Frontend: `VITE_API_URL=http://localhost:3001/api/v1`.
- Frontend: `VITE_USE_BACKEND=true` quando as telas forem migradas para consumir a API.

## Entidades

- `students`: alunos, matricula unica, foto e descritor facial.
- `books`: acervo, RFID, codigo do exemplar, curso/disciplina, localizacao fisica, fileira/prateleira, total de copias e copias disponiveis.
- `sessions`: entradas da biblioteca, ligadas ao aluno.
- `loans`: emprestimos, devolucoes e atraso.
- `events`: auditoria e atividade recente do dashboard.

## Regras Principais

- `students.registration` e unico.
- `books.available` nunca pode ser maior que `books.copies`.
- Emprestimo so pode ser criado se o livro existir e tiver copia disponivel.
- Ao emprestar, `books.available` diminui.
- Ao devolver, `books.available` aumenta ate o limite de `books.copies`.
- A validacao facial cria uma sessao de `entry`.
- `loans.status` pode ser `active`, `returned` ou `overdue`.

## Supabase

As tabelas ficam no schema `public`. Como `public` e exposto pela Data API do Supabase, toda tabela criada por SQL deve ter RLS habilitado. Mesmo que o app use conexao Postgres direta pelo backend, manter RLS ligado evita exposicao acidental se a Data API for usada depois.

Projeto aplicado:

- Nome: `EduLib`
- Project ref: `nubhrztcxtepeuyiyrgt`
- Host: `db.nubhrztcxtepeuyiyrgt.supabase.co`
- Regiao: `us-east-2`

O SQL consolidado fica em `database/supabase/schema.sql`. O seed de acervo fica em `database/supabase/seed.sql`. Depois, o backend precisa de uma connection string do Supabase em `backend/.env`.

Migracao remota aplicada em 2026-05-30: `add_book_rfid_location_fields`, adicionando `rfid`, `copy_code`, `course`, `discipline`, `location`, `row_code` e `shelf` em `public.books`.

Integracao remota aplicada em 2026-05-30:

- Role de aplicacao `edulib_app` criada para conexao Postgres direta.
- Grants e policies RLS para `edulib_app` nas tabelas `students`, `books`, `sessions`, `loans` e `events`.
- Grants e policies RLS para `anon` nas mesmas tabelas para permitir o modo `supabase-rest` usado pelo backend local quando a porta PostgreSQL esta bloqueada.
- Backend local validado em `DATA_PROVIDER=supabase-rest`: `health/db`, listagem de livros, cadastro de aluno com `faceDescriptor`, sessao de entrada, emprestimo e devolucao.
- Validacao completa em 2026-05-30 contra Supabase real: health, health/db, CRUD de alunos, CRUD de livros, busca por RFID, criacao/listagem/filtro de sessoes, criacao/listagem/exibicao/atualizacao de emprestimos, refresh de atrasados, devolucao, ajuste de disponibilidade do livro e eventos gerados automaticamente. Dados QA foram removidos apos o teste.
- Fluxo de Operacao remodelado em 2026-05-30: nao ha selecao manual de Entrada/Saida. A webcam fica em ciclo continuo, identifica o aluno, consulta a ultima sessao via backend, registra entrada se nao houver sessao aberta, ou inicia saida com janela RFID de alguns segundos quando houver sessao aberta. Na saida, livros lidos por RFID viram emprestimos, a sessao de saida e registrada e a permanencia e calculada nas notas/resultados.
- Tela principal de reconhecimento refinada em 2026-05-30: a camera exibe uma moldura facial sobreposta. Em espera, a moldura fica laranja com orientacao para posicionar o rosto; quando a identificacao e confirmada, a moldura fica verde, exibe "Entrada registrada com sucesso" ou "Saida registrada com sucesso", mostra dados do aluno por alguns segundos e retorna automaticamente ao modo de espera.
- Saida por FaceID refinada em 2026-05-30: depois de reconhecer um aluno com sessao aberta, a interface abre um modal "Esta com algum livro?". O fluxo permite finalizar sem livro, ler a tag por leitor NFID/RFID ou digitar o NFID manualmente; livros identificados aparecem no modal e so entao a saida pode ser finalizada com emprestimo vinculado.
- Auditoria do Acervo remodelada em 2026-05-30: tela em duas colunas, com livros pendentes a esquerda e livros validados a direita. O input do leitor RFID fica sempre focado, valida automaticamente por RFID/codigo do exemplar sem botao, move o item para validados e atualiza total esperado, total validado, pendentes e percentual concluido.
- Modulo mobile/PWA NFC criado em 2026-05-30 nas rotas `/nfc-mobile` e `/nfc`. Usa Web NFC (`NDEFReader`) quando disponivel em Android/Chrome e bloqueia o uso sem backend real (`VITE_USE_BACKEND=true`). Fluxos: cadastrar NFC do livro, validar retirada por RA/sessao ativa, registrar devolucao e marcar auditoria. Toda tag lida consulta o backend antes de agir; auditoria e leituras gravam eventos `nfc.*` via `POST /events`.
- Monitoramento de Livros reincluido em 2026-05-30 dentro do modulo Acervo como aba interna. A tela nao usa mocks: cruza `books`, `loans` e `students` vindos da API para listar livro, RFID, aluno responsavel/ultimo responsavel, RA, data/hora da retirada e status Disponivel/Emprestado, com filtros por livro/RFID, aluno/RA, curso e status.
- Reconhecimento facial otimizado em 2026-05-30: a operacao primeiro faz uma deteccao leve de presenca facial, captura um unico frame maior/mais nitido, congela a imagem, para temporariamente o stream da camera e usa somente esse frame para comparar FaceID. A camera solicita 1280x720 ideal e so volta ao monitoramento depois da conclusao, cancelamento do modal de saida ou fim da confirmacao.
- Acesso mobile local em desenvolvimento: o frontend infere a API pelo hostname atual quando `VITE_API_URL` nao esta definido, permitindo abrir `http://IP-DA-MAQUINA:5173/nfc-mobile` no celular e chamar `http://IP-DA-MAQUINA:3001/api/v1`. O backend permite origens de IP privado em ambiente de desenvolvimento.

## Como Rodar

```bash
npm run install:all
npm run dev
```

Backend: `http://localhost:3001/api/v1`
Frontend: `http://localhost:5173`
Portal do aluno: `http://localhost:5174`

## Pontos de Atencao

- Nunca colocar service role key ou senha do banco em variaveis `VITE_*`.
- Frontend com `VITE_USE_BACKEND=false` continua usando `localStorage`.
- O backend deve retornar JSON em camelCase, mesmo que o banco use snake_case.
- Ao mexer em banco, atualizar `database/supabase/schema.sql` e esta memoria se a arquitetura mudar.
- O reconhecimento facial usa `face-api.js` no frontend, com modelos em `frontend/public/models/face-api` e descritores `face-api-v1`. Ainda nao e uma biometria de producao como Face ID; para isso, adicionar liveness e protecoes anti-foto/video.
- O visual principal deve continuar corporativo/ERP: sidebar fixa, header superior com usuario, cards estatisticos, tabelas, modais e controles densos.
- O favicon usa a identidade EduLib em vermelho institucional (`#b70f16`) com detalhe azul-petroleo (`#365966`).
