@echo off
REM ===================================================================
REM  DIRNO - Changement du mot de passe d'un compte
REM ===================================================================

setlocal

set "RACINE=%~dp0"
set "PHP="

if defined DIRNO_PHP if exist "%DIRNO_PHP%" set "PHP=%DIRNO_PHP%"
if not defined PHP if exist "%RACINE%php\php.exe" set "PHP=%RACINE%php\php.exe"
if not defined PHP (
    for /f "delims=" %%P in ('where php.exe 2^>nul') do (
        if not defined PHP set "PHP=%%P"
    )
)

if not defined PHP (
    echo   [ERREUR] PHP est introuvable.
    pause
    exit /b 1
)

cd /d "%RACINE%api"
"%PHP%" bin\changer-mot-de-passe.php

echo.
pause
endlocal
