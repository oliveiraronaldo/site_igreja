# Roda os testes do site neste PC (Windows / PowerShell).
# Uso, na pasta do repositório:   .\tests\rodar.ps1
# Na primeira vez instala o necessário (Python precisa estar instalado).
# O ambiente fica fora do OneDrive, em %USERPROFILE%\.venvs\site_igreja.

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$venv = Join-Path $env:USERPROFILE ".venvs\site_igreja"
$py = Join-Path $venv "Scripts\python.exe"

if (-not (Test-Path $py)) {
    Write-Host "Preparando o ambiente de testes (só na primeira vez)..."
    python -m venv $venv
    & $py -m pip install --timeout 120 --retries 5 -r (Join-Path $raiz "tests\requirements.txt")
    & $py -m playwright install chromium
}

Push-Location $raiz
try {
    & $py -m pytest tests -q -p no:cacheprovider @args
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
