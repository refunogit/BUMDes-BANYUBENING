param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: powershell -ExecutionPolicy Bypass -File .\install.ps1"
    exit 0
}

function Resolve-PythonCommand {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        foreach ($version in @('3.13', '3.12', '3.11', '3.10')) {
            & py "-$version" -c "import sys" *> $null
            if ($LASTEXITCODE -eq 0) {
                return @{ Exe = 'py'; Args = @("-$version") }
            }
        }
    }

    if (Get-Command python -ErrorAction SilentlyContinue) {
        return @{ Exe = 'python'; Args = @() }
    }

    throw "Python tidak ditemukan. Install CPython 3.10-3.13 64-bit (disarankan 3.11 x64)."
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$ExtensionDir = Join-Path $ScriptDir "extension"
$CheckPy = Join-Path $ScriptDir "scripts\check_python.py"
$VenvDir = Join-Path $BackendDir ".venv"
$VenvPy = Join-Path $VenvDir "Scripts\python.exe"

Write-Host ""
Write-Host "==> Checking prerequisites..."
$PythonCmd = Resolve-PythonCommand
Write-Host "Using Python command: $($PythonCmd.Exe) $($PythonCmd.Args -join ' ')"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm not found. Install Node.js 18+ first."
}
& $PythonCmd.Exe @($PythonCmd.Args) $CheckPy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "==> Installing backend dependencies..."
if (Test-Path $VenvPy) {
    & $VenvPy $CheckPy *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Existing backend/.venv uses an unsupported Python version. Recreating it..."
        Remove-Item -Recurse -Force $VenvDir
    }
}
if (-not (Test-Path $VenvPy)) {
    & $PythonCmd.Exe @($PythonCmd.Args) -m venv $VenvDir
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
& $VenvPy $CheckPy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $VenvPy -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $VenvPy -m pip install --prefer-binary -r (Join-Path $BackendDir "requirements.txt")
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Backend dependency installation failed."
    Write-Host "HINT: Gunakan CPython 3.10-3.13 64-bit (disarankan 3.11 x64) agar pip bisa memakai wheel prebuilt."
    exit $LASTEXITCODE
}
Push-Location $BackendDir
& $VenvPy -m pip install -e ".[dev]"
$devExit = $LASTEXITCODE
Pop-Location
if ($devExit -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to install backend dev tools (pytest, ruff, httpx)."
    exit $devExit
}

Write-Host ""
Write-Host "==> Installing extension dependencies..."
Push-Location $ExtensionDir
npm install
$npmExit = $LASTEXITCODE
Pop-Location
if ($npmExit -ne 0) { exit $npmExit }

Write-Host ""
Write-Host "==> Preparing backend/.env..."
$EnvPath = Join-Path $BackendDir ".env"
if (-not (Test-Path $EnvPath)) {
    Copy-Item (Join-Path $BackendDir ".env.example") $EnvPath
    Write-Host "Created backend/.env from template."
} else {
    Write-Host "backend/.env already exists - leaving it unchanged."
}

Write-Host ""
Write-Host "Install complete."
Write-Host "Next: powershell -ExecutionPolicy Bypass -File .\run.ps1"
