$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

Write-Host "Iniciando backend en http://localhost:4000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run dev:backend"

Start-Sleep -Seconds 2

Write-Host "Iniciando frontend en http://localhost:5500 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run dev:frontend"

Write-Host "Proyecto Nucleo iniciado."
Write-Host "Frontend: http://localhost:5500"
Write-Host "Backend:  http://localhost:4000"
