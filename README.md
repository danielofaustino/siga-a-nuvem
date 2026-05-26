# Siga a Nuvem ☁️

PWA de eventos da **Regional 78 — AD Madureira (Juventude)**.
Lista os eventos da agenda do Google da regional, deixa os jovens confirmarem
presença com nome/WhatsApp/Instagram, e dá um painel `/admin` para a liderança
criar/editar eventos (que ficam sincronizados com o Google Calendar).

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Supabase** (Postgres + Auth para o admin)
- **Google Calendar API** (OAuth 2.0 — admin conecta a conta da regional uma vez)
- **PWA** (manifest + service worker, instalável no celular)
- Deploy no **Netlify** com `@netlify/plugin-nextjs`

## Estrutura

```
app/
  page.tsx                          → home (calendário + lista de eventos + filtros)
  eventos/[id]/page.tsx             → detalhe do evento + RSVP
  admin/
    login/page.tsx                  → login admin
    (protected)/                    → tudo aqui exige sessão Supabase
      page.tsx                      → dashboard com eventos
      eventos/novo/                 → criar evento
      eventos/[id]/editar/          → editar evento
      eventos/[id]/presencas/       → quem confirmou + export CSV
      igrejas/                      → CRUD das igrejas
      google/                       → conectar Google Calendar
  api/
    events/                         → CRUD eventos (sincroniza Google)
    events/[id]/rsvp/               → confirmar presença
    events/[id]/rsvp/export/        → CSV das presenças
    churches/                       → CRUD igrejas
    google/auth/                    → inicia OAuth
    google/callback/                → recebe code, salva refresh_token
    google/sync/                    → "puxar" eventos do Google
lib/
  supabase/                         → clients (browser, server, service-role)
  google/                           → OAuth helpers + wrapper do Calendar
  env.ts, types.ts, format.ts
supabase/migrations/0001_init.sql   → schema + RLS + seed das 3 igrejas
public/manifest.webmanifest, sw.js, icons/
```

## 1. Setup do Supabase

1. Crie um projeto em https://supabase.com → **New project**.
2. Em **SQL Editor**, cole e rode o conteúdo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Isso cria as tabelas `churches`, `events`, `attendances`, `google_credentials`,
   a view `event_attendance_counts`, RLS, e faz seed de 3 igrejas placeholder.
3. Em **Authentication → Providers**, garanta que **Email** está habilitado.
4. Em **Authentication → Users**, clique **Add user** e crie a conta do admin
   (ex: `admin@regional78.com`). Essa é a credencial usada em `/admin/login`.
5. Em **Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (segredo!)

## 2. Setup do Google Cloud (Calendar)

1. Em https://console.cloud.google.com crie um projeto (ou use um existente).
2. **APIs & Services → Library** → habilite **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - Tipo: **External**.
   - Adicione `vencedores.com.cristo.ad.jd.dracena@gmail.com` como **Test user**
     (enquanto o app estiver "em teste").
   - Scopes: `.../auth/calendar` e `.../auth/userinfo.email`.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs:
     - `http://localhost:3000/api/google/callback` (dev)
     - `https://SEU-DOMINIO.netlify.app/api/google/callback` (prod)
   - Anote `Client ID` e `Client Secret`.

## 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | De onde vem |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (segredo) |
| `GOOGLE_CLIENT_ID` | Google Cloud → OAuth client |
| `GOOGLE_CLIENT_SECRET` | idem |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/google/callback` em dev |
| `NEXT_PUBLIC_APP_URL` | URL do app (sem barra no fim) |

## 4. Rodando localmente

```bash
npm install
npm run dev
# abre http://localhost:3000
```

Fluxo recomendado de primeiro uso:

1. Acesse `/admin/login` → entre com a conta criada no Supabase.
2. Em `/admin/igrejas`, ajuste/cadastre as 3 igrejas da regional
   (o seed já criou 3 placeholders).
3. Em `/admin/google`, clique **Conectar com Google** e autorize com a conta
   `vencedores.com.cristo.ad.jd.dracena@gmail.com`. O refresh token fica salvo
   na tabela `google_credentials`.
4. Em `/admin/google`, clique **⟳ Puxar do Google Calendar** para importar
   os eventos já existentes.
5. Em `/admin → + Novo evento`, crie um evento. Ele é criado no Google Calendar
   da conta conectada e aparece no app.
6. Em `/`, o público vê o calendário e confirma presença.

## 5. Deploy no Netlify

1. Faça push do código para um repo no GitHub/GitLab.
2. Em https://app.netlify.com → **Add new site → Import an existing project**.
3. Selecione o repo. O `netlify.toml` já configura o build (`npm run build`)
   e o plugin `@netlify/plugin-nextjs`.
4. Em **Site settings → Environment variables**, adicione TODAS as variáveis
   do `.env.example` (atualizando `GOOGLE_REDIRECT_URI` e `NEXT_PUBLIC_APP_URL`
   para o domínio do Netlify).
5. Volte ao Google Cloud → Credentials → adicione o redirect URI de produção.
6. Faça deploy. Após o primeiro deploy, **refaça o passo 3 do fluxo acima**
   (conectar Google) usando o domínio de produção.

> **Importante:** as routes API e o middleware rodam como **Netlify Functions**
> automaticamente (graças ao `@netlify/plugin-nextjs`). Você não precisa
> configurar nada manualmente.

## 6. PWA — ícones

O app já vem com um ícone SVG em `public/icons/icon.svg` que funciona no
Chrome/Edge/Firefox em Android e desktop. Para uma experiência ideal no iOS
(que prefere PNG), gere PNGs 192×192 e 512×512 a partir do SVG:

```bash
# opção 1: site online — https://realfavicongenerator.net
# opção 2: imagemagick local
convert -background none public/icons/icon.svg -resize 192x192 public/icons/icon-192.png
convert -background none public/icons/icon.svg -resize 512x512 public/icons/icon-512.png
```

Depois, no `public/manifest.webmanifest`, adicione entradas para os PNGs.

## 7. Como funciona o sync com Google Calendar

- **Criar/editar/excluir evento no `/admin`** → o app chama a Calendar API
  com o refresh token salvo e replica a operação no Google. O `google_event_id`
  fica salvo na tabela `events`.
- **"⟳ Puxar do Google Calendar"** → busca os eventos dos próximos 90 dias e
  faz upsert no banco usando `google_event_id` como chave. Útil para importar
  eventos que já existem na agenda da regional ou que foram criados direto pelo
  Google Calendar.

Se quiser sync automático periódico, dá pra:

- Criar uma **Scheduled Function** no Netlify que chame `POST /api/google/sync`
  a cada hora.
- Ou usar **Calendar push notifications (watch)** — mais complexo, fica como
  evolução.

## 8. Privacidade dos dados de presença

- A view `event_attendance_counts` é pública (só conta, sem nomes).
- A tabela `attendances` é coberta por RLS:
  - Qualquer pessoa pode **inserir** (RSVP público).
  - Só usuário autenticado (admin) pode **ler/deletar**.
- A página `/admin/eventos/[id]/presencas` mostra nomes e contatos.
- Exporte com **⬇ Exportar CSV** para alimentar planilhas/grupos da liderança.

## 9. Próximos passos sugeridos

- Adicionar foto/banner de cada igreja na listagem.
- Notificação por WhatsApp lembrando o evento (precisa de um número Twilio /
  Z-API).
- Visualização em "agenda semanal" no app.
- Tela de "meus eventos confirmados" usando localStorage (sem login).
- Lista de espera quando `capacity` estala.

---

Feito com fé pelos jovens da Regional 78 ✝
