$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body
  )

  $params = @{
    Method      = $Method
    Uri         = $Url
    ContentType = "application/json"
  }

  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 5)
  }

  return Invoke-RestMethod @params
}

$baseUrl = "http://localhost:4000/api/v1"
$suffix = Get-Date -Format "yyyyMMddHHmmss"
$email = "ana.prueba.$suffix@proyectonucleo.local"
$password = "Admin12345*"

Write-Host "Probando /health/public ..."
$health = Invoke-JsonRequest -Method "GET" -Url "$baseUrl/health/public" -Body $null
$health | ConvertTo-Json -Depth 5

Write-Host "Probando /auth/register ..."
$register = Invoke-JsonRequest -Method "POST" -Url "$baseUrl/auth/register" -Body @{
  nombre   = "Ana"
  apellido = "Prueba"
  email    = $email
  password = $password
  rol      = "estudiante"
}
$register | ConvertTo-Json -Depth 6

Write-Host "Probando /auth/login ..."
$login = Invoke-JsonRequest -Method "POST" -Url "$baseUrl/auth/login" -Body @{
  email    = $email
  password = $password
}
$login | ConvertTo-Json -Depth 6
