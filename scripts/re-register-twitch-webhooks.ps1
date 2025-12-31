# Script para deletar e re-registrar webhooks da Twitch
# Uso: .\re-register-twitch-webhooks.ps1 -ClientId <CLIENT_ID> -ClientSecret <CLIENT_SECRET> -EventSubSecret <EVENTSUB_SECRET>

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

Write-Host "=== Re-registro de Webhooks Twitch ===" -ForegroundColor Cyan
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

# Passo 2: Buscar subscriptions existentes e deletar
Write-Host "2. Buscando subscriptions existentes..." -ForegroundColor Yellow
try {
    $headers = @{
        "Client-Id" = $ClientId
        "Authorization" = "Bearer $accessToken"
    }
    
    $subscriptionsResponse = Invoke-RestMethod -Uri "https://api.twitch.tv/helix/eventsub/subscriptions" -Method Get -Headers $headers
    
    if ($subscriptionsResponse.data.Count -gt 0) {
        Write-Host "   Encontradas $($subscriptionsResponse.data.Count) subscriptions" -ForegroundColor Cyan
        
        foreach ($subscription in $subscriptionsResponse.data) {
            Write-Host "   Deletando subscription: $($subscription.id) ($($subscription.type))..." -ForegroundColor Yellow
            try {
                Invoke-RestMethod -Uri "https://api.twitch.tv/helix/eventsub/subscriptions?id=$($subscription.id)" -Method Delete -Headers $headers | Out-Null
                Write-Host "      ✅ Deletada" -ForegroundColor Green
            } catch {
                Write-Host "      ⚠️  Erro ao deletar: $_" -ForegroundColor Yellow
            }
        }
        Write-Host ""
    } else {
        Write-Host "   Nenhuma subscription encontrada" -ForegroundColor Cyan
        Write-Host ""
    }
} catch {
    Write-Host "   ⚠️  Erro ao buscar subscriptions: $_" -ForegroundColor Yellow
    Write-Host ""
}

# Passo 3: Buscar User ID
Write-Host "3. Buscando User ID do usuário '$TwitchUsername'..." -ForegroundColor Yellow
try {
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

# Passo 4: Registrar novos webhooks
Write-Host "4. Registrando novos webhooks..." -ForegroundColor Yellow
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
    Write-Host "A Twitch irá verificar os webhooks automaticamente em alguns segundos." -ForegroundColor Cyan
    Write-Host "Aguarde alguns minutos e verifique o status novamente com:" -ForegroundColor Cyan
    Write-Host "  Invoke-RestMethod -Uri 'https://api.twitch.tv/helix/eventsub/subscriptions' -Headers @{'Client-Id'='$ClientId';'Authorization'='Bearer $accessToken'}" -ForegroundColor White
} else {
    Write-Host "❌ Nenhum webhook foi registrado. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

















