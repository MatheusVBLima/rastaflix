# Guia: Registrar Webhooks da Twitch sem CLI

Este guia mostra como registrar os webhooks da Twitch usando apenas a API REST, sem precisar instalar a CLI da Twitch.

## Pré-requisitos

Você precisa ter:
- `TWITCH_CLIENT_ID` - ID da sua aplicação Twitch
- `TWITCH_CLIENT_SECRET` - Secret da sua aplicação Twitch  
- `TWITCH_EVENTSUB_SECRET` - Secret para validar webhooks (já configurado na Vercel)

## Método 1: Script PowerShell (Recomendado)

Execute o script PowerShell com suas credenciais:

```powershell
.\scripts\register-twitch-webhooks-api.ps1 `
  -ClientId "SEU_CLIENT_ID" `
  -ClientSecret "SEU_CLIENT_SECRET" `
  -EventSubSecret "SEU_TWITCH_EVENTSUB_SECRET" `
  -TwitchUsername "ovelhera"
```

O script irá:
1. ✅ Obter um token OAuth da Twitch
2. ✅ Buscar o User ID do "ovelhera"
3. ✅ Registrar os 3 webhooks (stream.online, stream.offline, channel.update)

## Método 2: Usando curl (Windows/Linux/Mac)

### Passo 1: Obter Token OAuth

```bash
curl -X POST "https://id.twitch.tv/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=SEU_CLIENT_ID&client_secret=SEU_CLIENT_SECRET&grant_type=client_credentials"
```

Salve o `access_token` retornado.

### Passo 2: Buscar User ID

```bash
curl -X GET "https://api.twitch.tv/helix/users?login=ovelhera" \
  -H "Client-Id: SEU_CLIENT_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

Anote o `id` retornado.

### Passo 3: Registrar Webhooks

Substitua `USER_ID` pelo ID obtido e `ACCESS_TOKEN` pelo token do passo 1:

#### stream.online
```bash
curl -X POST "https://api.twitch.tv/helix/eventsub/subscriptions" \
  -H "Client-Id: SEU_CLIENT_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "stream.online",
    "version": "1",
    "condition": {
      "broadcaster_user_id": "USER_ID"
    },
    "transport": {
      "method": "webhook",
      "callback": "https://rastaflix.vercel.app/api/webhooks/twitch",
      "secret": "SEU_TWITCH_EVENTSUB_SECRET"
    }
  }'
```

#### stream.offline
```bash
curl -X POST "https://api.twitch.tv/helix/eventsub/subscriptions" \
  -H "Client-Id: SEU_CLIENT_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "stream.offline",
    "version": "1",
    "condition": {
      "broadcaster_user_id": "USER_ID"
    },
    "transport": {
      "method": "webhook",
      "callback": "https://rastaflix.vercel.app/api/webhooks/twitch",
      "secret": "SEU_TWITCH_EVENTSUB_SECRET"
    }
  }'
```

#### channel.update
```bash
curl -X POST "https://api.twitch.tv/helix/eventsub/subscriptions" \
  -H "Client-Id: SEU_CLIENT_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "channel.update",
    "version": "2",
    "condition": {
      "broadcaster_user_id": "USER_ID"
    },
    "transport": {
      "method": "webhook",
      "callback": "https://rastaflix.vercel.app/api/webhooks/twitch",
      "secret": "SEU_TWITCH_EVENTSUB_SECRET"
    }
  }'
```

## Método 3: Usando Postman ou Insomnia

### 1. Obter Token OAuth
- **POST** `https://id.twitch.tv/oauth2/token`
- **Body** (x-www-form-urlencoded):
  - `client_id`: SEU_CLIENT_ID
  - `client_secret`: SEU_CLIENT_SECRET
  - `grant_type`: client_credentials

### 2. Buscar User ID
- **GET** `https://api.twitch.tv/helix/users?login=ovelhera`
- **Headers**:
  - `Client-Id`: SEU_CLIENT_ID
  - `Authorization`: Bearer SEU_ACCESS_TOKEN

### 3. Criar Subscription
- **POST** `https://api.twitch.tv/helix/eventsub/subscriptions`
- **Headers**:
  - `Client-Id`: SEU_CLIENT_ID
  - `Authorization`: Bearer SEU_ACCESS_TOKEN
  - `Content-Type`: application/json
- **Body** (JSON):
```json
{
  "type": "stream.online",
  "version": "1",
  "condition": {
    "broadcaster_user_id": "USER_ID"
  },
  "transport": {
    "method": "webhook",
    "callback": "https://rastaflix.vercel.app/api/webhooks/twitch",
    "secret": "SEU_TWITCH_EVENTSUB_SECRET"
  }
}
```

Repita para `stream.offline` e `channel.update` (mude o `type` e `version`).

## Verificar Subscriptions

```bash
curl -X GET "https://api.twitch.tv/helix/eventsub/subscriptions" \
  -H "Client-Id: SEU_CLIENT_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

## Testar Webhook

Acesse no navegador:
```
https://rastaflix.vercel.app/api/webhooks/twitch
```

Deve retornar:
```json
{"status":"ok","service":"twitch-webhook"}
```

## Troubleshooting

### Erro: "Invalid client"
- Verifique se `CLIENT_ID` e `CLIENT_SECRET` estão corretos
- Certifique-se de que a aplicação está ativa no Twitch Developer Console

### Erro: "Invalid callback URL"
- A URL deve ser acessível publicamente (HTTPS)
- Verifique se o deploy na Vercel foi concluído

### Erro: "Invalid secret"
- O `TWITCH_EVENTSUB_SECRET` deve ter entre 10 e 100 caracteres
- Deve ser exatamente o mesmo valor configurado na Vercel

### Webhook não recebe eventos
- Verifique os logs da Vercel em tempo real
- Use a API para verificar o status das subscriptions
- Certifique-se de que o `broadcaster_user_id` está correto

## Deletar Subscriptions

Para listar todas:
```bash
curl -X GET "https://api.twitch.tv/helix/eventsub/subscriptions" \
  -H "Client-Id: SEU_CLIENT_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

Para deletar uma específica:
```bash
curl -X DELETE "https://api.twitch.tv/helix/eventsub/subscriptions?id=SUBSCRIPTION_ID" \
  -H "Client-Id: SEU_CLIENT_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

















