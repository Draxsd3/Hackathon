# Edulib-ID

Sistema de identificacao e gestao de biblioteca escolar com reconhecimento facial e QR Code.

## Visao Geral

O Edulib-ID permite que escolas controlem entradas, saidas, emprestimos e devolucoes na biblioteca de forma rapida e segura, usando reconhecimento facial via webcam ou QR Code de identificacao. Inclui um assistente virtual para tirar duvidas e um dashboard com metricas em tempo real.

## Stack

### Frontend
- React 19+ com Vite
- JavaScript
- Tailwind CSS
- React Router
- Lucide Icons

### Backend
- Node.js
- Express.js

### Banco de Dados
- **Offline/demo:** localStorage no frontend (`VITE_USE_BACKEND=false`)
- **Integrado:** backend Express conectado ao PostgreSQL/Supabase via `DATABASE_URL`

## Estrutura de Pastas

```
edulib-id/
├── frontend/          # SPA React + Vite
├── backend/           # API Express
├── database/          # Schemas SQL e seeds para migracao futura
├── docs/              # Documentacao tecnica
└── package.json       # Orquestracao
```

## Como rodar

Instale as dependencias de todos os modulos:

```bash
npm run install:all
```

Suba frontend e backend juntos:

```bash
npm run dev
```

Ou separadamente:

```bash
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:3001
```

## Paginas

- **Home** - Tela inicial com acesso rapido as funcionalidades
- **StudentRegister** - Cadastro de alunos com foto e geracao de QR
- **Entry / Exit** - Registro de entrada e saida (face ou QR)
- **Loan** - Emprestimo de livros
- **ReturnBook** - Devolucao de livros
- **Assistant** - Chat de duvidas sobre a biblioteca
- **Dashboard** - Estatisticas e atividades recentes

## Migracao para banco real

Toda persistencia passa por `frontend/src/services/*`. Para rodar conectado ao Supabase:

1. Aplique `database/supabase/schema.sql` no projeto Supabase correto.
2. Aplique `database/supabase/seed.sql` se quiser iniciar com livros de exemplo.
3. Configure `backend/.env` com `DATABASE_URL` e `DATABASE_SSL=true`.
4. Configure `frontend/.env` com `VITE_USE_BACKEND=true`.
5. Rode `npm run dev`.

Veja [docs/architecture.md](docs/architecture.md) para detalhes.

## Documentacao

- [docs/architecture.md](docs/architecture.md) - Arquitetura e decisoes
- [docs/business-rules.md](docs/business-rules.md) - Regras de negocio
- [docs/api-documentation.md](docs/api-documentation.md) - Contratos REST
