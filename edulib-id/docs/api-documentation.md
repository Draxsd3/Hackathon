# API - Edulib-ID Backend

Todas as rotas tem prefixo `/api/v1` e retornam JSON.

## Health

`GET /api/v1/health` -> `200 { status, service, timestamp }`

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

- Backend usa store em memoria (`config/database.js`) para o MVP.
- Frontend persiste em `localStorage` (`utils/storage.js`).
- Os shapes e contratos ja estao alinhados com `database/schema/*.sql`, pronto para migrar.
