# Arquitetura

## Visao geral

```
+-------------+      HTTP       +--------------+      SQL      +-------------+
|  Frontend   | <--- HTTP ---> |   Backend    | -----------> | PostgreSQL  |
| React/Vite  |                  | Express/Node |              |  / Supabase |
+-------------+                  +--------------+              +-------------+
       |
       | MVP: localStorage
       v
+-------------+
| utils/      |
| storage.js  |
+-------------+
```

O frontend pode rodar em dois modos. Com `VITE_USE_BACKEND=false`, ele usa `localStorage` para demo offline. Com `VITE_USE_BACKEND=true`, os services chamam a API Express, e o backend persiste no PostgreSQL/Supabase via `DATABASE_URL`.

## Camadas do frontend

| Camada     | Responsabilidade                                                       |
|------------|------------------------------------------------------------------------|
| pages/     | Composicao de UI, controle de estado local da tela                      |
| components/| UI reutilizavel (layout, common, camera, qr, assistant, dashboard)      |
| hooks/     | Hooks customizados (camera, debounce, colecoes locais)                  |
| services/  | Regras de aplicacao (criar emprestimo, identificar aluno, etc.)         |
| utils/     | Funcoes puras (storage, datas, face, qr)                                |

## Camadas do backend

| Camada       | Responsabilidade                                          |
|--------------|-----------------------------------------------------------|
| routes/      | Definicao de endpoints e validacao                         |
| controllers/ | Adaptacao HTTP <-> servicos                                |
| services/    | Logica de negocio                                          |
| models/      | Formato dos dados (validacao + factory)                    |
| config/      | Inicializacao (env, banco)                                 |
| middlewares/ | Erros, CORS, logging, validacao                            |

## Fluxos principais

### Cadastro de aluno
1. `pages/StudentRegister` coleta dados + foto
2. `utils/facialUtils.computeDescriptor` gera o descritor da face
3. `services/studentService.create` persiste no storage
4. `utils/qrUtils.generateStudentQrDataUrl` gera o QR

### Entrada / saida
1. `IdentifyStudent` permite busca, QR ou face
2. `services/sessionService.create` registra a sessao + dispara evento

### Emprestimo
1. Identificacao do aluno
2. Busca do livro
3. `services/loanService.create` reduz `available`, agenda `dueDate`, registra evento

### Devolucao
1. Identificacao do aluno
2. `services/loanService.activeByStudent` lista emprestimos abertos
3. `services/loanService.returnLoan` devolve, ajusta `available`, registra evento

## Migracao MVP -> Producao

Quando for hora de sair do localStorage:

1. **Banco**: aplicar `database/supabase/schema.sql` e opcionalmente `database/supabase/seed.sql`.
2. **Backend**: configurar `DATABASE_URL` e `DATABASE_SSL=true` no `backend/.env`.
3. **Frontend**: definir `VITE_USE_BACKEND=true` no `frontend/.env`.
4. **UI**: nao precisa mudar.

A clausula chave dessa arquitetura e que **paginas e componentes nao conhecem o storage**. Eles consomem services, que sao a unica peca a ser trocada.
