# Deploy EduLib ID

## Backend no Render

Use o arquivo `render.yaml` na raiz do projeto `edulib-id`.

Configuracao:

- Servico: `edulib-id-backend`
- Runtime: Node
- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/api/v1/health`
- Provedor de dados: `supabase-rest`

Variaveis obrigatorias no Render:

```env
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://*.vercel.app
```

Depois do deploy, valide:

```txt
https://SEU_BACKEND.onrender.com/api/v1/health
https://SEU_BACKEND.onrender.com/api/v1/health/db
```

## Frontend na Vercel

O projeto pode apontar para a raiz `edulib-id` ou para `edulib-id/frontend`.

Se apontar para `edulib-id`, use o `vercel.json` da raiz:

- Install command: `npm ci --prefix frontend`
- Build command: `npm run build --prefix frontend`
- Output directory: `frontend/dist`

Se apontar para `edulib-id/frontend`, use o `frontend/vercel.json`:

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Ambos fazem:

- Proxy `/api/*` para o backend do Render.
- Fallback SPA para rotas diretas como `/nfc-mobile`.

Variavel obrigatoria na Vercel:

```env
BACKEND_URL=https://SEU_BACKEND.onrender.com
```

Nao inclua `/api/v1` em `BACKEND_URL`; o proxy ja acrescenta o caminho.
