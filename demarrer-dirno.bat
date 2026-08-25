@echo off
REM ===================================================================
REM  DIRNO - Verification des transports exceptionnels
REM
REM  Premier lancement : configure automatiquement l'application
REM  (secret, base de donnees, cache), puis ouvre le navigateur.
REM  Lancements suivants : demarrage immediat.
REM
REM  Le serveur n'ecoute QUE sur 127.0.0.1 : l'application n'est
REM  accessible que depuis ce poste, jamais depuis le reseau.
REM ===================================================================

setlocal enabledelayedexpansion

set "RACINE=%~dp0"
set "ADRESSE=127.0.0.1"
set "PORT=8000"

REM --- Localisation de PHP -------------------------------------------
set "PHP="

if defined DIRNO_PHP if exist "%DIRNO_PHP%" set "PHP=%DIRNO_PHP%"

if not defined PHP if exist "%RACINE%php\php.exe" set "PHP=%RACINE%php\php.exe"

if not defined PHP (
    for /f "delims=" %%P in ('where php.exe 2^>nul') do (
        if not defined PHP set "PHP=%%P"
    )
)

if not defined PHP (
    echo.
    echo   [ERREUR] PHP est introuvable sur ce poste.
    echo.
    echo   Solution : placer PHP dans le sous-dossier "php" du dossier DIRNO,
    echo   de sorte que le fichier suivant existe :
    echo       %RACINE%php\php.exe
    echo.
    pause
    exit /b 1
)

REM --- Verification de l'extension pdo_sqlite ------------------------
"%PHP%" -r "exit(extension_loaded('pdo_sqlite')?0:1);" >nul 2>&1
if errorlevel 1 (
    echo.
    echo   [ERREUR] L'extension PHP "pdo_sqlite" n'est pas activee.
    echo.
    echo   Ouvrir le fichier php.ini et retirer le point-virgule devant :
    echo       ;extension=pdo_sqlite
    echo.
    pause
    exit /b 1
)

cd /d "%RACINE%api"

REM --- Le serveur tourne-t-il deja ? ---------------------------------
netstat -ano | findstr /R /C:"%ADRESSE%:%PORT% .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    start "" "http://%ADRESSE%:%PORT%/app/"
    exit /b 0
)

REM ===================================================================
REM  PREMIER LANCEMENT - configuration automatique
REM ===================================================================

set "PREMIER=0"
if not exist ".env.local"  set "PREMIER=1"
if not exist "var\data.db" set "PREMIER=1"

REM --- 1. Secret et base de donnees ----------------------------------
REM  Confie a un script PHP : la generation du secret et du mot de passe
REM  utilise des caracteres que cmd.exe gere mal (une version precedente
REM  de ce lanceur produisait un secret vide).
if "!PREMIER!"=="1" (
    echo   Premiere utilisation : configuration de DIRNO, merci de patienter...
    "%PHP%" bin\installer.php >nul 2>&1
)

REM --- 2. Cache applicatif -------------------------------------------
REM  Sans prechauffage, la toute premiere requete echoue en erreur 500.
if not exist "var\cache\prod" (
    "%PHP%" bin\console cache:warmup --env=prod --no-debug >nul 2>&1
)

REM --- Demarrage -----------------------------------------------------
start "DIRNO" /B "%PHP%" -S %ADRESSE%:%PORT% -t public

REM Laisser le serveur se lier au port avant d'ouvrir le navigateur.
REM (ping plutot que timeout : timeout echoue si l'entree est redirigee)
if "!PREMIER!"=="1" (ping -n 6 127.0.0.1 >nul 2>&1) else (ping -n 3 127.0.0.1 >nul 2>&1)

start "" "http://%ADRESSE%:%PORT%/app/"

endlocal
