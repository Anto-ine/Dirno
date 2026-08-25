# ===================================================================
#  Prepare le dossier a remettre au client.
#
#  Produit un dossier autonome : le poste du client n'a besoin
#  ni de Node.js, ni de Composer, ni meme de PHP installe.
#
#  Usage :  powershell -ExecutionPolicy Bypass -File creer-livraison.ps1
# ===================================================================

param(
    [string]$Destination = "$env:USERPROFILE\DIRNO-livraison",
    [string]$CheminPhp   = "$env:USERPROFILE\Downloads\php-8.5.4-nts-Win32-vs17-x64"
)

$ErrorActionPreference = "Stop"
$racine = $PSScriptRoot

Write-Host "=== Preparation de la livraison DIRNO ===" -ForegroundColor Cyan

# --- 1. Compilation du front ---------------------------------------
Write-Host "[1/5] Compilation du front..."
Push-Location "$racine\dirno-react"
& npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "La compilation du front a echoue." }
Pop-Location

# --- 2. Dependances de production ----------------------------------
Write-Host "[2/5] Dependances PHP (sans les outils de developpement)..."
Push-Location "$racine\api"
& composer install --no-dev --optimize-autoloader --no-interaction
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "composer install a echoue." }
Pop-Location

# --- 3. Copie des fichiers -----------------------------------------
Write-Host "[3/5] Copie des fichiers vers $Destination ..."
if (Test-Path $Destination) { Remove-Item -Recurse -Force $Destination }
New-Item -ItemType Directory -Force -Path "$Destination\api" | Out-Null

# Le dossier var/ est volontairement exclu : base, cache, journaux et
# secret sont regeneres au premier lancement sur le poste du client.
$exclusions = @('var', '.git', '.env.local', 'node_modules')

Get-ChildItem "$racine\api" -Force | Where-Object { $exclusions -notcontains $_.Name } | ForEach-Object {
    Copy-Item $_.FullName -Destination "$Destination\api" -Recurse -Force
}

Copy-Item "$racine\DIRNO.vbs"                 -Destination $Destination -Force
Copy-Item "$racine\demarrer-dirno.bat"        -Destination $Destination -Force
Copy-Item "$racine\changer-mot-de-passe.bat"  -Destination $Destination -Force
Copy-Item "$racine\diagnostic-poste.ps1"      -Destination $Destination -Force
Copy-Item "$racine\INSTALLATION.md"           -Destination $Destination -Force

# --- 4. PHP embarque ------------------------------------------------
if (Test-Path $CheminPhp) {
    Write-Host "[4/5] Integration de PHP (aucune installation requise chez le client)..."
    Copy-Item $CheminPhp -Destination "$Destination\php" -Recurse -Force

    # S'assurer que pdo_sqlite est actif dans le PHP livre.
    $ini = "$Destination\php\php.ini"
    if (Test-Path $ini) {
        (Get-Content $ini) -replace '^;extension=pdo_sqlite', 'extension=pdo_sqlite' |
            Set-Content $ini -Encoding UTF8
    }
} else {
    Write-Warning "[4/5] PHP introuvable dans $CheminPhp - le client devra installer PHP lui-meme."
}

# --- 5. Notice ------------------------------------------------------
Write-Host "[5/5] Notice pour le client..."
@"
DIRNO
=====

Pour ouvrir l'application :

    Double-cliquer sur l'icone  DIRNO  du Bureau.

Puis se connecter avec les identifiants remis par votre
administrateur.

C'est tout.


---------------------------------------------------------------
A savoir

  - Le tout premier demarrage prend une trentaine de secondes.
    Les suivants sont immediats.

  - Ne pas deplacer ni renommer ce dossier.

  - Pour fermer : fermer la fenetre du navigateur.

  - En cas de probleme, contacter votre administrateur.
"@ | Set-Content "$Destination\LISEZMOI.txt" -Encoding UTF8

# Notice technique, destinee a la personne qui installe (pas au client).
@"
DIRNO - Notice d'installation (technicien)
==========================================

A FAIRE UNE SEULE FOIS, SUR LE POSTE DU CLIENT :

  1. Copier ce dossier sur le poste (par exemple dans C:\DIRNO).

  2. Double-cliquer sur DIRNO.vbs.
     -> l'application se configure seule (~30 s)
     -> un raccourci "DIRNO" apparait sur le Bureau
     -> un fichier MOT-DE-PASSE-INITIAL.txt est cree ici

  3. Ouvrir MOT-DE-PASSE-INITIAL.txt et se connecter une fois
     pour verifier que tout fonctionne.

  4. Double-cliquer sur changer-mot-de-passe.bat pour definir
     le mot de passe que le client utilisera.

  5. Supprimer MOT-DE-PASSE-INITIAL.txt.

  6. Communiquer au client :  admin@dirno.fr  +  le mot de passe
     choisi a l'etape 4.

Le client n'a alors plus qu'a double-cliquer sur l'icone du Bureau.

---------------------------------------------------------------

SAUVEGARDE
  Toutes les donnees tiennent dans   api\var\data.db
  C'est le seul fichier a sauvegarder.

SECURITE
  L'application n'ecoute que sur 127.0.0.1 : elle n'est joignable
  depuis aucune autre machine du reseau.
  Chaque installation genere son propre secret de signature.

Details complets : voir INSTALLATION.md
"@ | Set-Content "$Destination\INSTALLATION-technicien.txt" -Encoding UTF8

$taille = [math]::Round((Get-ChildItem $Destination -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 1)

Write-Host ""
Write-Host "=== Livraison prete ===" -ForegroundColor Green
Write-Host "  Dossier : $Destination"
Write-Host "  Taille  : $taille Mo"
Write-Host ""
Write-Host "  Copier ce dossier sur le poste du client, puis lui faire"
Write-Host "  double-cliquer sur DIRNO.vbs."
