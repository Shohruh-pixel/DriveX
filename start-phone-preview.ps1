param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif"  = "image/gif"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".webp" = "image/webp"
}

function Get-ContentType {
  param([string]$Path)

  $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  if ($mimeTypes.ContainsKey($ext)) {
    return $mimeTypes[$ext]
  }

  return "application/octet-stream"
}

function Resolve-RequestedPath {
  param([string]$UrlPath)

  $decoded = [System.Uri]::UnescapeDataString(($UrlPath -replace "^/", ""))
  if ([string]::IsNullOrWhiteSpace($decoded)) {
    $decoded = "index.html"
  }

  if ($decoded -match "^react/") {
    $decoded = $decoded -replace "^react/", ""
  }

  $candidate = Join-Path $root $decoded
  $fullPath = [System.IO.Path]::GetFullPath($candidate)
  $fullRoot = [System.IO.Path]::GetFullPath($root)

  if (-not $fullPath.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }

  if ((Test-Path $fullPath -PathType Container)) {
    $indexPath = Join-Path $fullPath "index.html"
    if (Test-Path $indexPath -PathType Leaf) {
      return $indexPath
    }
  }

  if (Test-Path $fullPath -PathType Leaf) {
    return $fullPath
  }

  return $null
}

function Get-WifiAddress {
  $candidates = @()

  try {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
      Where-Object {
        $_.IPAddress -like "192.168.*" -or
        $_.IPAddress -like "10.*" -or
        $_.IPAddress -like "172.16.*" -or
        $_.IPAddress -like "172.17.*" -or
        $_.IPAddress -like "172.18.*" -or
        $_.IPAddress -like "172.19.*" -or
        $_.IPAddress -like "172.2?.*" -or
        $_.IPAddress -like "172.3?.*"
      } |
      Sort-Object InterfaceMetric
  } catch {
    return $null
  }

  if ($candidates.Count -gt 0) {
    return $candidates[0].IPAddress
  }

  return $null
}

function Write-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType = "text/plain; charset=utf-8"
  )

  $headers = @(
    "HTTP/1.1 $StatusCode $StatusText",
    "Content-Type: $ContentType",
    "Content-Length: $($Body.Length)",
    "Cache-Control: no-store, no-cache, must-revalidate",
    "Connection: close",
    ""
  ) -join "`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers + "`r`n")
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Start()

$wifiAddress = Get-WifiAddress

Write-Host ""
Write-Host "DRIVEX phone preview is running." -ForegroundColor Cyan
Write-Host "Open on this PC:" -ForegroundColor DarkGray
Write-Host "  http://localhost:$Port/index.html#/services" -ForegroundColor White
if ($wifiAddress) {
  Write-Host "Open on your phone (same Wi-Fi):" -ForegroundColor DarkGray
  Write-Host "  http://$wifiAddress`:$Port/index.html#/services" -ForegroundColor White
}
Write-Host ""
Write-Host "If Windows Firewall asks, allow Private network access." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $stream = $client.GetStream()
      $buffer = New-Object byte[] 8192
      $read = $stream.Read($buffer, 0, $buffer.Length)

      if ($read -le 0) {
        continue
      }

      $requestText = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)
      $requestLine = ($requestText -split "`r?`n")[0]
      $parts = $requestLine -split " "

      if ($parts.Count -lt 2) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Bad request")
        Write-Response -Stream $stream -StatusCode 400 -StatusText "Bad Request" -Body $body
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      $rawPath = ($parts[1] -split "\?")[0]

      if ($method -ne "GET" -and $method -ne "HEAD") {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Method not allowed")
        Write-Response -Stream $stream -StatusCode 405 -StatusText "Method Not Allowed" -Body $body
        continue
      }

      $filePath = Resolve-RequestedPath -UrlPath $rawPath
      if (-not $filePath) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
        Write-Response -Stream $stream -StatusCode 404 -StatusText "Not Found" -Body $body
        continue
      }

      $body = if ($method -eq "HEAD") { [byte[]]::new(0) } else { [System.IO.File]::ReadAllBytes($filePath) }
      $contentType = Get-ContentType -Path $filePath
      Write-Response -Stream $stream -StatusCode 200 -StatusText "OK" -Body $body -ContentType $contentType
    } catch {
      try {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Server error")
        Write-Response -Stream $stream -StatusCode 500 -StatusText "Server Error" -Body $body
      } catch {
      }
    } finally {
      if ($stream) { $stream.Dispose() }
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
