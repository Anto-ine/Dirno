# ===================================================================
#  DIRNO - Diagnostic de compatibilite du poste
#
#  A lancer SUR LE POSTE DU CLIENT, avant de deployer, pour savoir
#  si une politique de securite empechera l'application de tourner.
#
#  Ne modifie rien : lecture seule.
#
#  Usage :  powershell -ExecutionPolicy Bypass -File diagnostic-poste.ps1
# ===================================================================

$resultats = @()

function Verifier($nom, $etat, $detail) {
    $script:resultats += [PSCustomObject]@{ Test = $nom; Etat = $etat; Detail = $detail }
}

Write-Host ""
Write-Host "  DIRNO - Diagnostic de compatibilite" -ForegroundColor Cyan
Write-Host "  ===================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Windows Script Host (necessaire pour DIRNO.vbs) -------------
$wshBloque = $false
foreach ($ruche in @('HKLM:\SOFTWARE\Microsoft\Windows Script Host\Settings',
                     'HKCU:\SOFTWARE\Microsoft\Windows Script Host\Settings')) {
    if (Test-Path $ruche) {
        $v = (Get-ItemProperty $ruche -ErrorAction SilentlyContinue).Enabled
        if ($null -ne $v -and $v -eq 0) { $wshBloque = $true }
    }
}
if ($wshBloque) {
    Verifier "Windows Script Host" "BLOQUANT" "Desactive par strategie - DIRNO.vbs ne pourra pas s'executer"
} else {
    Verifier "Windows Script Host" "OK" "Actif - le lanceur .vbs fonctionnera"
}

# --- 2. AppLocker / WDAC (blocage d'executables) --------------------
$applocker = $false
try {
    $regles = Get-ChildItem "HKLM:\SOFTWARE\Policies\Microsoft\Windows\SrpV2" -ErrorAction SilentlyContinue
    if ($regles) { $applocker = $true }
} catch {}
if ($applocker) {
    Verifier "AppLocker" "A VERIFIER" "Des regles existent - php.exe pourrait etre bloque"
} else {
    Verifier "AppLocker" "OK" "Aucune regle detectee"
}

$wdac = $false
try {
    $ci = Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard -ErrorAction SilentlyContinue
    if ($ci -and $ci.CodeIntegrityPolicyEnforcementStatus -gt 1) { $wdac = $true }
} catch {}
if ($wdac) {
    Verifier "WDAC / Device Guard" "A VERIFIER" "Integrite du code appliquee - binaire non signe possiblement bloque"
} else {
    Verifier "WDAC / Device Guard" "OK" "Pas d'application stricte detectee"
}

# --- 3. Politique d'execution PowerShell ----------------------------
$pol = Get-ExecutionPolicy
Verifier "ExecutionPolicy" "INFO" "$pol (le lanceur n'utilise pas PowerShell, sans impact)"

# --- 4. Droits d'ecriture dans un dossier utilisateur ---------------
$cible = Join-Path $env:USERPROFILE "DIRNO-test-ecriture"
try {
    New-Item -ItemType Directory -Path $cible -Force -ErrorAction Stop | Out-Null
    Set-Content -Path (Join-Path $cible "t.txt") -Value "ok" -ErrorAction Stop
    Remove-Item $cible -Recurse -Force
    Verifier "Ecriture dossier utilisateur" "OK" "L'application peut ecrire sa base de donnees"
} catch {
    Verifier "Ecriture dossier utilisateur" "BLOQUANT" $_.Exception.Message
}

# --- 5. Port 8000 disponible ----------------------------------------
$occupe = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($occupe) {
    Verifier "Port 8000" "A VERIFIER" "Deja utilise - changer le port dans demarrer-dirno.bat"
} else {
    Verifier "Port 8000" "OK" "Disponible"
}

# --- 6. Ecoute sur la boucle locale ---------------------------------
# Port 0 = un port libre choisi par le systeme : le test reste valable
# meme si 8000 est deja occupe.
try {
    $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), 0)
    $l.Start()
    $porte = $l.LocalEndpoint.Port
    $l.Stop()
    Verifier "Ecoute 127.0.0.1" "OK" "Autorisee (testee sur le port $porte) - aucun pare-feu a debloquer"
} catch {
    Verifier "Ecoute 127.0.0.1" "BLOQUANT" $_.Exception.Message
}

# --- 7. Antivirus / EDR ---------------------------------------------
try {
    $av = Get-CimInstance -Namespace root\SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction SilentlyContinue
    if ($av) {
        Verifier "Antivirus" "INFO" (($av | ForEach-Object { $_.displayName }) -join ', ')
    } else {
        Verifier "Antivirus" "INFO" "Non determine"
    }
} catch { Verifier "Antivirus" "INFO" "Non determine" }

# --- 8. Droits administrateur ---------------------------------------
$estAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
            ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Verifier "Droits administrateur" "INFO" $(if ($estAdmin) { "Oui (non requis par DIRNO)" } else { "Non - DIRNO n'en a pas besoin" })

# --- 9. Bureau (pour le raccourci) ----------------------------------
$bureau = (New-Object -ComObject WScript.Shell).SpecialFolders("Desktop")
Verifier "Bureau" "INFO" $bureau

# --- Restitution -----------------------------------------------------
Write-Host ""
$resultats | Format-Table -AutoSize -Property Test, Etat, Detail | Out-String | Write-Host

$bloquants = @($resultats | Where-Object { $_.Etat -eq 'BLOQUANT' })
$avertis   = @($resultats | Where-Object { $_.Etat -eq 'A VERIFIER' })

if ($bloquants.Count -gt 0) {
    Write-Host "  => $($bloquants.Count) point(s) BLOQUANT(S) : voir avec la DSI avant de deployer." -ForegroundColor Red
} elseif ($avertis.Count -gt 0) {
    Write-Host "  => $($avertis.Count) point(s) a verifier, rien de bloquant a priori." -ForegroundColor Yellow
} else {
    Write-Host "  => Aucun blocage detecte : l'application devrait fonctionner." -ForegroundColor Green
}
Write-Host ""
