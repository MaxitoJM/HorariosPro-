$ErrorActionPreference = "Stop"

$postgresBin = "C:\Program Files\PostgreSQL\17\bin"
$psql = Join-Path $postgresBin "psql.exe"
$createdb = Join-Path $postgresBin "createdb.exe"

$dbHost = "localhost"
$dbPort = "5433"
$adminDb = "postgres"
$adminUser = "postgres"
$dbName = "proyecto_nucleo"
$dbUser = "proyecto_nucleo_app"
$dbPassword = "ProyectoNucleo2026*"

$roleSqlFile = Join-Path $PSScriptRoot "setup-postgres-role.sql"
$roleSql = @'
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '__DB_USER__') THEN
    CREATE ROLE __DB_USER__ LOGIN PASSWORD '__DB_PASSWORD__';
  ELSE
    ALTER ROLE __DB_USER__ WITH LOGIN PASSWORD '__DB_PASSWORD__';
  END IF;
END
$do$;
'@

$roleSql = $roleSql.Replace("__DB_USER__", $dbUser).Replace("__DB_PASSWORD__", $dbPassword)

Set-Content -Path $roleSqlFile -Value $roleSql -Encoding ASCII
& $psql -h $dbHost -p $dbPort -U $adminUser -d $adminDb -v ON_ERROR_STOP=1 -f $roleSqlFile
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo crear o actualizar el rol de PostgreSQL."
}
Remove-Item $roleSqlFile -Force

$dbExists = & $psql -h $dbHost -p $dbPort -U $adminUser -d $adminDb -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
if (($dbExists | Out-String).Trim() -ne "1") {
  & $createdb -h $dbHost -p $dbPort -U $adminUser $dbName
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear la base de datos PostgreSQL."
  }
}

& $psql -h $dbHost -p $dbPort -U $adminUser -d $adminDb -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;"
if ($LASTEXITCODE -ne 0) {
  throw "No se pudieron asignar permisos sobre la base de datos."
}

Write-Host "PostgreSQL configurado para Proyecto Nucleo."
Write-Host "Base: $dbName"
Write-Host "Usuario: $dbUser"
Write-Host "Puerto: $dbPort"
