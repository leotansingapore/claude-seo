# Opens the Claude SEO Plugin Marketplace web app in your default browser.
# Usage: .\webapp\open.ps1

$file = Join-Path $PSScriptRoot "index.html"

if (-Not (Test-Path $file)) {
    Write-Error "index.html not found at $file"
    exit 1
}

Write-Host "Opening Claude SEO Plugin Marketplace..."
Start-Process $file
