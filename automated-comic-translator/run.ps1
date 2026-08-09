param(
    [switch]$Watch,
    [switch]$BuildOnly,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: powershell -ExecutionPolicy Bypass -File .\run.ps1 [-Watch] [-BuildOnly]"
    exit 0
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$ExtensionDir = Join-Path $ScriptDir "extension"
$CheckPy = Join-Path $ScriptDir "scripts\check_python.py"
$VenvPy = Join-Path $BackendDir ".venv\Scripts\python.exe"

if (-not (Test-Path (Join-Path $ExtensionDir "node_modules"))) {
    throw "extension dependencies missing. Run install.ps1 first."
}
if (-not (Test-Path $VenvPy)) {
    throw "backend environment missing. Run install.ps1 first."
}
& $VenvPy $CheckPy *> $null
if ($LASTEXITCODE -ne 0) {
    throw "backend/.venv uses an unsupported Python version. Run install.ps1 again."
}

Write-Host ""
Write-Host "==> Building extension..."
Push-Location $ExtensionDir
npm run build
$buildExit = $LASTEXITCODE
Pop-Location
if ($buildExit -ne 0) { exit $buildExit }

if ($BuildOnly) {
    Write-Host ""
    Write-Host "Extension built at $ExtensionDir\dist"
    exit 0
}

if ($Watch) {
    Write-Host ""
    Write-Host "==> Starting extension watch mode in a separate window..."
    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $ExtensionDir
}

$BindHost = "0.0.0.0"
$BindPort = "8000"
$EnvPath = Join-Path $BackendDir ".env"
if (Test-Path $EnvPath) {
    $envLines = Get-Content $EnvPath
    foreach ($line in $envLines) {
        if ($line -match '^HOST=(.+)$') { $BindHost = $Matches[1].Trim() }
        if ($line -match '^PORT=(.+)$') { $BindPort = $Matches[1].Trim() }
    }
}

Write-Host ""
Write-Host "==> Starting backend on http://$BindHost`:$BindPort"
Push-Location $BackendDir
& $VenvPy -m uvicorn app.main:app --host $BindHost --port $BindPort
$serverExit = $LASTEXITCODE
Pop-Location
exit $serverExit
