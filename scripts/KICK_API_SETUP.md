# Kick API — status de live no Rastaflix

A Kick bloqueia requisições serverless comuns (403 / Cloudflare). O Rastaflix usa a **API oficial** (`api.kick.com`) quando as credenciais estão configuradas.

## 1. Criar app no Kick Dev

1. Acesse [Kick Developer](https://kick.com/settings/developer)
2. Crie um app e anote **Client ID** e **Client Secret**
3. Em webhooks (opcional, futuro), use a URL do deploy: `https://rastaflix.vercel.app/api/webhooks/kick`

## 2. Variáveis na Vercel

No projeto **rastaflix** → Settings → Environment Variables:

| Variável | Obrigatório |
|----------|-------------|
| `KICK_CLIENT_ID` | Sim |
| `KICK_CLIENT_SECRET` | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (atualiza `streamer_config`) |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | Para Twitch |

Adicione em **Production** e faça **Redeploy**.

## 3. Validar

Após o deploy, abra:

`https://rastaflix.vercel.app/api/live-status`

Com a stream ao vivo na Kick, espere `is_live_kick: true`.

## 4. Slug no banco

Em `streamer_config`, `kick_username` deve ser o slug correto (ex.: `ovelheram`, minúsculo).
