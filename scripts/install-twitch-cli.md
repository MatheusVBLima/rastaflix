# Instalar Twitch CLI no Windows

## Opção 1: Usando WinGet (Mais Simples)

Se você tem o Windows 10/11 com WinGet instalado:

```powershell
winget install Twitch.TwitchCLI
```

## Opção 2: Usando Scoop

Se você tem o Scoop instalado:

```powershell
scoop bucket add twitch https://github.com/twitchdev/scoop-bucket.git
scoop install twitch-cli
```

Se não tem o Scoop, instale primeiro:

```powershell
# Instalar Scoop
iwr -useb get.scoop.sh | iex

# Depois instalar Twitch CLI
scoop bucket add twitch https://github.com/twitchdev/scoop-bucket.git
scoop install twitch-cli
```

## Opção 3: Download Manual

1. Baixe o arquivo `.zip` de: https://github.com/twitchdev/twitch-cli/releases
2. Extraia o arquivo `twitch.exe`
3. Adicione o diretório ao PATH do sistema ou coloque em uma pasta que já está no PATH

## Verificar Instalação

Após instalar, feche e reabra o PowerShell, depois execute:

```powershell
twitch version
```

Se funcionar, você verá a versão instalada.

## Autenticar na CLI

Depois de instalar, você precisa autenticar:

```powershell
twitch token
```

Isso abrirá o navegador para você autorizar a aplicação.
