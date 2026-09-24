$port = 8080
$url = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try {
    $listener.Start()
} catch {
    $port = 8081
    $url = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($url)
    $listener.Start()
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "  Servidor local activo en: $url" -ForegroundColor Cyan
Write-Host "  Inicio: $url" -ForegroundColor White
Write-Host "  Panel Admin: ${url}admin.html" -ForegroundColor White
Write-Host "  Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Green

Start-Process $url

$folder = $PSScriptRoot
if (-not $folder) { $folder = (Get-Location).Path }

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        
        $localPath = $req.Url.LocalPath
        if ($localPath -eq "/" -or $localPath -eq "") { $localPath = "/index.html" }
        $filePath = Join-Path $folder $localPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $res.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $res.AddHeader("Access-Control-Allow-Origin", "*")
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 No encontrado")
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
        $res.OutputStream.Close()
    } catch {
        # Ignorar desconexiones de cliente
    }
}
