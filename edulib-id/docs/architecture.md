# Arquitetura

## Visao geral

```
+-------------+      HTTP       +--------------+      SQL      +-------------+
|  Frontend   | <--- (futuro) ---> |   Backend    | -----------> | PostgreSQL  |
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

No **MVP**, o frontend e completamente autonomo: toda persistencia vai para `localStorage` atraves de `frontend/src/utils/storage.js`. O backend Express ja esta implementado em paralelo, com store em memoria, e expoe os mesmos contratos REST que o frontend usara depois.

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

1. **Backend**: substituir `backend/src/config/database.js` para usar um pool PostgreSQL ou Supabase. Aplicar os arquivos em `database/schema/*.sql`.
2. **Frontend**: definir `VITE_USE_BACKEND=true` no `.env` e adaptar cada service para usar `api.js` no lugar de `utils/storage.js` (a assinatura das funcoes nao muda).
3. **UI**: nao precisa mudar.

A clausula chave dessa arquitetura e que **paginas e componentes nao conhecem o storage**. Eles consomem services, que sao a unica peca a ser trocada.
