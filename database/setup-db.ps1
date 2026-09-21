$ErrorActionPreference = 'Stop'

$pgUser = if ($env:PGUSER) { $env:PGUSER } else { 'postgres' }
$dbName = if ($env:PGDATABASE) { $env:PGDATABASE } else { 'atendimento_digital' }
$schemaPath = Join-Path $PSScriptRoot 'schema.sql'

Write-Host 'Verificando acesso ao PostgreSQL...'
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    throw 'O comando psql não foi encontrado. Instale o PostgreSQL e certifique-se de que o binário está no PATH.'
}

Write-Host "Criando ou validando o banco '$dbName'..."
$databaseExists = & psql -U $pgUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
if (-not $databaseExists) {
    & psql -U $pgUser -d postgres -c "CREATE DATABASE \"$dbName\";"
}

Write-Host "Executando schema em $schemaPath ..."
& psql -U $pgUser -d $dbName -f $schemaPath

Write-Host "Verificando tabela principal..."
& psql -U $pgUser -d $dbName -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

Write-Host 'Banco configurado com sucesso.'
