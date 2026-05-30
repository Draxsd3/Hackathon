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
- **MVP:** localStorage (camada `utils/storage.js` faz o acoplamento)
- **Producao:** preparado para migrar para PostgreSQL/Supabase sem mudar a camada de servicos

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

Toda persistencia passa por `frontend/src/services/*` que internamente usa `utils/storage.js`. Para migrar:

1. Implemente os endpoints no `backend/src/routes` (controllers ja prontos)
2. Aplique os schemas em `database/schema/*.sql`
3. Troque a implementacao de `utils/storage.js` por chamadas `api.js` ao backend

Veja [docs/architecture.md](docs/architecture.md) para detalhes.

## Documentacao

- [docs/architecture.md](docs/architecture.md) - Arquitetura e decisoes
- [docs/business-rules.md](docs/business-rules.md) - Regras de negocio
- [docs/api-documentation.md](docs/api-documentation.md) - Contratos REST
