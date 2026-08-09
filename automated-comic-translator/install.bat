@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "BACKEND_DIR=%ROOT%\backend"
set "EXTENSION_DIR=%ROOT%\extension"
set "CHECK_PY=%ROOT%\scripts\check_python.py"
set "PY_CMD="
set "VENV_PY=%BACKEND_DIR%\.venv\Scripts\python.exe"

echo.
echo ==^> Checking prerequisites...
call :resolve_python
if errorlevel 1 exit /b 1
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm not found. Install Node.js 18+ first.
  exit /b 1
)
%PY_CMD% "%CHECK_PY%"
if errorlevel 1 exit /b 1

echo.
echo ==^> Installing backend dependencies...
if exist "%VENV_PY%" (
  "%VENV_PY%" "%CHECK_PY%" >nul 2>nul
  if errorlevel 1 (
    echo Existing backend\.venv uses an unsupported Python version. Recreating it...
    rmdir /s /q "%BACKEND_DIR%\.venv"
  )
)
if not exist "%VENV_PY%" (
  %PY_CMD% -m venv "%BACKEND_DIR%\.venv"
  if errorlevel 1 exit /b 1
)
"%VENV_PY%" "%CHECK_PY%"
if errorlevel 1 exit /b 1
"%VENV_PY%" -m pip install --upgrade pip
if errorlevel 1 exit /b 1
"%VENV_PY%" -m pip install --prefer-binary -r "%BACKEND_DIR%\requirements.txt"
if errorlevel 1 (
  echo.
  echo ERROR: Backend dependency installation failed.
  echo HINT: Gunakan CPython 3.10-3.13 64-bit ^(disarankan 3.11 x64^) agar pip bisa memakai wheel prebuilt.
  echo Jika Python default Anda terlalu baru, install Python 3.11 lalu jalankan lagi install.bat.
  exit /b 1
)
pushd "%BACKEND_DIR%"
"%VENV_PY%" -m pip install -e ".[dev]"
if errorlevel 1 (
  popd
  echo.
  echo ERROR: Failed to install backend dev tools ^(pytest, ruff, httpx^).
  exit /b 1
)
popd

echo.
echo ==^> Installing extension dependencies...
pushd "%EXTENSION_DIR%"
call npm install
if errorlevel 1 (
  popd
  exit /b 1
)
popd

echo.
echo ==^> Preparing backend\.env...
if not exist "%BACKEND_DIR%\.env" (
  copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
  echo Created backend\.env from template.
) else (
  echo backend\.env already exists - leaving it unchanged.
)

echo.
echo Install complete.
echo Next: run run.bat to build the extension and start the backend.
pause
exit /b 0

:resolve_python
for %%V in (3.13 3.12 3.11 3.10) do (
  py -%%V -c "import sys" >nul 2>nul
  if not errorlevel 1 (
    set "PY_CMD=py -%%V"
    goto :python_found
  )
)
where python >nul 2>nul
if not errorlevel 1 (
  set "PY_CMD=python"
  goto :python_found
)
echo ERROR: Python tidak ditemukan. Install CPython 3.10-3.13 64-bit ^(disarankan 3.11 x64^).
exit /b 1

:python_found
echo Using Python command: %PY_CMD%
exit /b 0
