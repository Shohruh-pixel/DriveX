$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodePath = "C:\Program Files\nodejs\node.exe"
$EnvPath = Join-Path $ProjectRoot ".env"

if (-not (Test-Path $NodePath)) {
  throw "Node.js not found at $NodePath"
}

if (-not (Test-Path $EnvPath)) {
  throw "Missing .env file. Copy .env.example to .env and add OPENAI_API_KEY."
}

$port = "8080"
Get-Content $EnvPath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
  $parts = $line.Split("=", 2)
  if ($parts[0].Trim() -eq "PORT" -and $parts[1].Trim()) {
    $script:port = $parts[1].Trim().Trim('"').Trim("'")
  }
}

$listeners = netstat -ano | Select-String ":$port" | ForEach-Object { ($_ -split "\s+")[-1] } | Select-Object -Unique
foreach ($processId in $listeners) {
  if ($processId -match "^\d+$") {
    Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue
  }
}

Set-Location $ProjectRoot
& $NodePath "server.js"
