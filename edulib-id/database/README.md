# Database

Os arquivos SQL aqui representam o esquema final do Edulib-ID quando ele sair do MVP em localStorage e for para um banco real (PostgreSQL ou Supabase).

## Estrutura

```
database/
├── schema/
│   ├── students.sql
│   ├── books.sql
│   ├── sessions.sql
│   ├── loans.sql
│   └── events.sql
└── seed/
    └── booksSeed.sql
```

## Ordem de aplicacao

```
1) students.sql
2) books.sql
3) sessions.sql     (FK para students)
4) loans.sql        (FK para students e books)
5) events.sql
```

Depois, popule com o seed:

```
psql -d edulib_id -f schema/students.sql
psql -d edulib_id -f schema/books.sql
psql -d edulib_id -f schema/sessions.sql
psql -d edulib_id -f schema/loans.sql
psql -d edulib_id -f schema/events.sql
psql -d edulib_id -f seed/booksSeed.sql
```

## Supabase

Use `supabase/schema.sql` para criar todas as tabelas, indices, triggers de `updated_at` e RLS em uma unica execucao. Depois aplique `supabase/seed.sql` para popular o acervo inicial.

O backend usa conexao Postgres direta via `DATABASE_URL`, entao nao exponha senha do banco nem service role key no frontend. Em Supabase, mantenha `DATABASE_SSL=true`.

## Migracao do MVP

O MVP grava em `localStorage` no namespace `edulib-id:v1`. Para migrar:

1. Exporte os dados do navegador (ex.: `console.log(JSON.stringify(localStorage))`).
2. Transforme em arquivos `.sql` ou use as rotas POST do backend para reimportar.
3. Em `frontend/src/services/api.js`, troque `VITE_USE_BACKEND=true` no `.env`.
4. Substitua a implementacao dos services para chamarem `api.js` em vez de `utils/storage.js`.
