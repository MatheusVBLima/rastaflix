# Script para registrar webhooks da Twitch usando a API REST diretamente
# Uso: .\register-twitch-webhooks-api.ps1 -ClientId <CLIENT_ID> -ClientSecret <CLIENT_SECRET> -EventSubSecret <EVENTSUB_SECRET> -TwitchUsername ovelhera

param(
    [Parameter(Mandatory=$true)]
    [string]$ClientId,
    
    [Parameter(Mandatory=$true)]
    [string]$ClientSecret,
    
    [Parameter(Mandatory=$true)]
    [string]$EventSubSecret,
    
    [Parameter(Mandatory=$false)]
    [string]$TwitchUsername = "ovelhera",
    
    [Parameter(Mandatory=$false)]
    [string]$CallbackUrl = "https://rastaflix.vercel.app/api/webhooks/twitch"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Registro de Webhooks Twitch via API ===" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Obter token OAuth
Write-Host "1. Obtendo token de acesso OAuth..." -ForegroundColor Yellow
try {
    $tokenBody = @{
        client_id = $ClientId
        client_secret = $ClientSecret
        grant_type = "client_credentials"
    }
    
    $tokenResponse = Invoke-RestMethod -Uri "https://id.twitch.tv/oauth2/token" -Method Post -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenResponse.access_token
    
    if (-not $accessToken) {
        throw "Token de acesso não retornado"
    }
    
    Write-Host "   ✅ Token obtido com sucesso" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Erro ao obter token: $_" -ForegroundColor Red
    exit 1
}

# Passo 2: Buscar User ID do streamer
Write-Host "2. Buscando User ID do usuário '$TwitchUsername'..." -ForegroundColor Yellow
try {
    $headers = @{
        "Client-Id" = $ClientId
        "Authorization" = "Bearer $accessToken"
    }
    
    $userResponse = Invoke-RestMethod -Uri "https://api.twitch.tv/helix/users?login=$TwitchUsername" -Method Get -Headers $headers
    
    if ($userResponse.data.Count -eq 0) {
        throw "Usuário '$TwitchUsername' não encontrado"
    }
    
    $userId = $userResponse.data[0].id
    $displayName = $userResponse.data[0].display_name
    
    Write-Host "   ✅ Usuário encontrado: $displayName (ID: $userId)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Erro ao buscar usuário: $_" -ForegroundColor Red
    exit 1
}

# Passo 3: Registrar webhooks
Write-Host "3. Registrando webhooks..." -ForegroundColor Yellow
Write-Host ""

$webhookTypes = @(
    @{
        type = "stream.online"
        version = "1"
    },
    @{
        type = "stream.offline"
        version = "1"
    },
    @{
        type = "channel.update"
        version = "2"
    }
)

$headers = @{
    "Client-Id" = $ClientId
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$successCount = 0
$errorCount = 0

foreach ($webhookType in $webhookTypes) {
    $subscriptionBody = @{
        type = $webhookType.type
        version = $webhookType.version
        condition = @{
            broadcaster_user_id = $userId
        }
        transport = @{
            method = "webhook"
            callback = $CallbackUrl
            secret = $EventSubSecret
        }
    } | ConvertTo-Json -Depth 10
    
    Write-Host "   Registrando $($webhookType.type)..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.twitch.tv/helix/eventsub/subscriptions" -Method Post -Headers $headers -Body $subscriptionBody
        
        if ($response.data.Count -gt 0) {
            $subscription = $response.data[0]
            Write-Host "      ✅ Registrado! Status: $($subscription.status) | ID: $($subscription.id)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "      ⚠️  Resposta vazia da API" -ForegroundColor Yellow
            $errorCount++
        }
    } catch {
        $errorMessage = $_.Exception.Message
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMessage = $errorDetails.message
        } catch {
            # Se não conseguir parsear JSON, usa a mensagem original
        }
        
        Write-Host "      ❌ Erro: $errorMessage" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

# Resumo
Write-Host "=== Resumo ===" -ForegroundColor Cyan
Write-Host "Webhooks registrados com sucesso: $successCount" -ForegroundColor $(if ($successCount -gt 0) { "Green" } else { "Red" })
Write-Host "Erros: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "✅ Processo concluído!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para verificar as subscriptions ativas, você pode usar:" -ForegroundColor Cyan
    Write-Host "  Invoke-RestMethod -Uri 'https://api.twitch.tv/helix/eventsub/subscriptions' -Headers @{'Client-Id'='$ClientId';'Authorization'='Bearer $accessToken'}" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou acesse: https://rastaflix.vercel.app/api/webhooks/twitch" -ForegroundColor Cyan
    Write-Host "  (deve retornar: {`"status`":`"ok`",`"service`":`"twitch-webhook`"})" -ForegroundColor White
} else {
    Write-Host "❌ Nenhum webhook foi registrado. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

















