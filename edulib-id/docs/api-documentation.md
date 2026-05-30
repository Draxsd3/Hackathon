# API - Edulib-ID Backend

Todas as rotas tem prefixo `/api/v1` e retornam JSON.

## Health

`GET /api/v1/health` -> `200 { status, service, timestamp }`

`GET /api/v1/health/db` -> `200 { status, database, serverTime, timestamp }`

## Students

| Metodo | Rota                       | Descricao                       |
|--------|----------------------------|---------------------------------|
| GET    | `/students?search=`        | Lista alunos                    |
| GET    | `/students/:id`            | Detalhe                         |
| POST   | `/students`                | Cria. Body: `{ name*, registration*, classGroup?, email?, photo?, faceDescriptor? }` |
| PUT    | `/students/:id`            | Atualiza                        |
| DELETE | `/students/:id`            | Remove                          |

`*` = obrigatorio.

## Books

| Metodo | Rota                  | Descricao                                |
|--------|-----------------------|------------------------------------------|
| GET    | `/books?search=`      | Lista livros                              |
| GET    | `/books/:id`          | Detalhe                                   |
| POST   | `/books`              | Cria. Body: `{ title*, author*, isbn?, category?, copies?, available?, cover? }` |
| PUT    | `/books/:id`          | Atualiza                                  |
| DELETE | `/books/:id`          | Remove                                    |

## Sessions

| Metodo | Rota                    | Descricao                                |
|--------|-------------------------|------------------------------------------|
| GET    | `/sessions`             | Filtros: `studentId`, `type`, `from`, `to` |
| POST   | `/sessions`             | Body: `{ studentId*, type*, method?, notes? }` (`type` = entry|exit) |

## Loans

| Metodo | Rota                          | Descricao                                |
|--------|-------------------------------|------------------------------------------|
| GET    | `/loans?studentId=&status=`   | Lista                                     |
| GET    | `/loans/:id`                  | Detalhe                                   |
| POST   | `/loans`                      | Body: `{ studentId*, bookId*, days?, notes? }` |
| POST   | `/loans/refresh-overdue`      | Atualiza emprestimos vencidos             |
| POST   | `/loans/:id/return`           | Marca como devolvido                      |

Erros:
- 404 livro nao encontrado
- 409 sem copias disponiveis

## Events

| Metodo | Rota                       | Descricao                |
|--------|----------------------------|--------------------------|
| GET    | `/events?type=&limit=`     | Lista eventos recentes   |

## Formato de erro

```json
{
  "error": "ValidationError",
  "message": "Dados invalidos",
  "details": ["name e obrigatorio"]
}
```

## Persistencia atual

- Backend usa PostgreSQL/Supabase via `DATABASE_URL`.
- Frontend usa a API quando `VITE_USE_BACKEND=true`; com `false`, usa `localStorage`.
- O schema consolidado para Supabase fica em `database/supabase/schema.sql`.
