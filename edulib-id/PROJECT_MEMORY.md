# EduLib ID - Memoria do Projeto

## Objetivo atual

O EduLib ID esta no MVP focado em controlar a movimentacao dos livros da biblioteca com FaceID e RFID/NFC.

O sistema deve responder:

- Quem entrou na biblioteca.
- Quem saiu da biblioteca.
- Qual livro saiu.
- Qual livro retornou.
- Quem esta com cada livro.
- Quais livros estao disponiveis.
- Quais livros estao emprestados.

Funcionalidades secundarias, graficos avancados e dados mockados devem ficar fora do fluxo principal.

## Estrutura recuperada

- Painel principal: `frontend/src/pages/Platform/index.jsx`.
- App mobile/PWA NFC: `frontend/src/pages/NfcMobile/index.jsx`.
- Rotas ativas:
  - `/` para o painel principal.
  - `/nfc-mobile` e `/nfc` para o app mobile NFC.
- Sidebar do painel: Dashboard, Operacao, Acervo, Alunos, Relatorios e Configuracoes.
- O `main.jsx` nao deve chamar `ensureSeedData`; as telas devem consumir API/backend.

## Backend e banco

- Backend Express em `backend/src`.
- API local: `http://localhost:3001/api/v1`.
- Provider atual: `supabase-rest`.
- Supabase project ref: `nubhrztcxtepeuyiyrgt`.
- Supabase URL: `https://nubhrztcxtepeuyiyrgt.supabase.co`.
- Credenciais ficam em `backend/.env`.
- Nunca expor `service_role` no frontend. O backend pode usar chave publishable/anon se as politicas do projeto permitirem o Data API.

## Services principais

Frontend:

- `studentService`
- `bookService`
- `loanService`
- `sessionService`
- `eventService`
- `rfidService`

Backend:

- `student.service.js`
- `book.service.js`
- `loan.service.js`
- `session.service.js`
- `event.service.js`

## Fluxo operacional

Entrada:

1. A camera detecta um rosto dentro da area de enquadramento.
2. O sistema captura um frame unico.
3. A validacao facial identifica o aluno.
4. Se nao existir sessao aberta, registra entrada.

Saida:

1. A camera identifica o aluno.
2. Se existir sessao aberta, abre o modal "Esta com algum livro?".
3. O operador pode ler/digitar NFID/RFID.
4. Se houver livros, cria emprestimos vinculados ao aluno.
5. Registra saida e encerra a permanencia.

Devolucao:

1. O livro e identificado pelo NFID/RFID.
2. O sistema localiza emprestimo ativo.
3. O emprestimo e encerrado.
4. O livro volta para disponivel.

## Recuperacao de 2026-05-30

Outro agente reverteu parte do projeto para telas antigas, com `MainLayout`, seed local e imports quebrados. A recuperacao religou o painel principal, restaurou a integracao REST com Supabase e recriou o app mobile NFC.

Ao mexer novamente, preservar:

- Rotas simples em `AppRoutes.jsx`.
- Ausencia de seed/mock no boot.
- Tela `/nfc-mobile` para leitura NFC no celular.
- Backend apontando para Supabase via `supabaseRest.js`.
