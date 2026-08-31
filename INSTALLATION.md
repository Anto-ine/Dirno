# DIRNO — Installation et exploitation

Application de vérification des transports exceptionnels.
Déploiement visé : **poste unique**, application accessible uniquement depuis ce poste.

---

## 1. Côté client — utilisation

**Double-cliquer sur `DIRNO.vbs`.** C'est tout.

Le premier lancement configure l'application automatiquement (≈ 30 s) : secret
propre au poste, base de données, compte administrateur, cache. Les lancements
suivants prennent moins de 10 s. Aucune commande, aucune fenêtre de terminal.

### Première connexion

Le premier lancement crée un fichier **`MOT-DE-PASSE-INITIAL.txt`** à la racine du
dossier, contenant l'adresse et un mot de passe **généré aléatoirement pour ce
poste** (format `Abcd-1234-Efgh-5678`).

Ensuite :

1. se connecter avec ces identifiants ;
2. changer le mot de passe → double-clic sur **`changer-mot-de-passe.bat`** ;
3. **supprimer `MOT-DE-PASSE-INITIAL.txt`**.

### Arrêt

Fermer le navigateur puis, si besoin, terminer `php.exe` dans le Gestionnaire
des tâches.

---

## 2. Côté livreur — préparer le dossier à remettre

Sur le poste de développement :

```powershell
powershell -ExecutionPolicy Bypass -File creer-livraison.ps1
```

Le script compile le front, installe les dépendances de production, embarque PHP
et produit `%USERPROFILE%\DIRNO-livraison` (≈ 110 Mo).

**Il suffit de copier ce dossier sur le poste du client.** Celui-ci n'a besoin
ni de Node.js, ni de Composer, ni même de PHP installé : tout est embarqué.

Le dossier livré ne contient **ni secret, ni base de données, ni journaux** :
chaque installation génère les siens au premier lancement.

### Prérequis (poste de développement uniquement)

| Composant | Version | Usage |
|---|---|---|
| PHP | 8.1+ avec `pdo_sqlite` | exécution et compilation |
| Composer | 2.x | dépendances du back |
| Node.js | 20+ | compilation du front |

> **Extension `pdo_sqlite`** : dans `php.ini`, la ligne `;extension=pdo_sqlite`
> doit être décommentée. Sans elle, toute requête touchant la base échoue en
> erreur 500. Le script de livraison l'active automatiquement dans le PHP embarqué.

### Emplacement de PHP sur le poste client

Le lanceur cherche PHP dans cet ordre :

1. la variable d'environnement `DIRNO_PHP` (chemin complet de `php.exe`) ;
2. le sous-dossier `php\` du dossier DIRNO (cas normal après livraison) ;
3. le `PATH` du système.

Si aucun n'est trouvé, le lanceur affiche un message explicite plutôt que
d'échouer silencieusement.

---

## 3. Démarrage automatique avec le poste (facultatif)

Pour que DIRNO se lance à l'ouverture de session, déposer un raccourci dans le
dossier **Démarrage** de l'utilisateur. Une seule commande, **sans droits
administrateur** :

```powershell
$s = (New-Object -ComObject WScript.Shell).CreateShortcut("$([Environment]::GetFolderPath('Startup'))\DIRNO.lnk"); $s.TargetPath = "C:\DIRNO\DIRNO.vbs"; $s.WorkingDirectory = "C:\DIRNO"; $s.Save()
```

> Adapter `C:\DIRNO` à l'emplacement réel du dossier sur le poste du client.

Pour vérifier, ou pour retirer le démarrage automatique, ouvrir le dossier avec
`Win+R` puis `shell:startup` : le raccourci `DIRNO` s'y trouve, et il suffit de
le supprimer pour revenir en arrière.

### Variante par tâche planifiée

Le Planificateur de tâches convient aussi, mais **`Register-ScheduledTask` échoue
en « Accès refusé » depuis un PowerShell ordinaire** : il faut une console lancée
en tant qu'administrateur, ce dont le dossier Démarrage se passe. À réserver au
cas où la DSI impose ce mécanisme.

```powershell
# À exécuter dans un PowerShell ADMINISTRATEUR
$action    = New-ScheduledTaskAction -Execute "wscript.exe" `
                -Argument '"C:\DIRNO\DIRNO.vbs"'
$trigger   = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Limited

Register-ScheduledTask -TaskName "DIRNO" -Action $action -Trigger $trigger `
                       -Principal $principal `
                       -Description "Serveur local DIRNO - transports exceptionnels"
```

`-RunLevel Limited` : une fois créée, la tâche s'exécute **sans privilèges
administrateur**, conformément au principe de moindre privilège. Seule sa
création en demande.

---

## 4. Sécurité

### Mesures en place

| Mesure | Détail |
|---|---|
| **Aucune exposition réseau** | Le serveur écoute sur `127.0.0.1` uniquement. Injoignable depuis le réseau DIRNO. |
| **Jetons signés** | HMAC-SHA256 avec le secret de l'installation, expiration 12 h. Un jeton forgé est rejeté. |
| **Révocation immédiate** | Désactiver un compte invalide ses jetons en cours sans attendre l'expiration. |
| **Anti-bruteforce** | 5 échecs → blocage 15 min par couple e-mail + IP. |
| **Journal d'audit** | `api/var/audit/audit-AAAA-MM.log` : connexions, échecs, blocages, suppressions, gestion des comptes. |
| **Mots de passe** | Hachés en bcrypt, jamais stockés ni journalisés en clair. Minimum 8 caractères. |
| **Pas de fuite d'erreur** | `APP_ENV=prod` : les erreurs ne révèlent ni trace d'exécution ni chemin disque. |
| **Même origine** | Front et API servis par le même processus : aucune ouverture CORS. |
| **Énumération de comptes** | Message d'erreur identique que le compte existe ou non. |

### Automatique à l'installation

- Secret unique par poste (32 octets aléatoires) — jamais celui du développement.
- Mot de passe administrateur unique par poste, remis via `MOT-DE-PASSE-INITIAL.txt`.

### À faire après installation

- [ ] **Changer le mot de passe** (`changer-mot-de-passe.bat`) puis **supprimer `MOT-DE-PASSE-INITIAL.txt`**.
- [ ] **Restreindre les droits NTFS** sur `api/var/` (base, journaux) au seul compte de l'agent.
- [ ] **Mettre en place une sauvegarde** de `api/var/data.db` (voir §5).
- [ ] Faire valider les limites de longueur **30 / 35 / 45 m** par le client.

### Limite connue à signaler à la DSI

Le serveur HTTP utilisé est le serveur intégré de PHP (`php -S`), dont la
documentation officielle indique qu'il n'est pas prévu pour la production.
Ce choix est acceptable ici car le service est **lié à la boucle locale**, sans
exposition réseau et avec un seul utilisateur simultané. Si la DSI l'exige, il
peut être remplacé par Caddy ou Apache sans modifier le code applicatif : seul
le lanceur `demarrer-dirno.bat` change.

---

## 5. Exploitation

### Sauvegarde

Toutes les données tiennent dans un seul fichier : **`api/var/data.db`**.
Le copier régulièrement (script planifié vers un partage réseau sauvegardé) :

```powershell
Copy-Item "C:\DIRNO\api\var\data.db" `
          "\\serveur-dirno\sauvegardes\dirno-$(Get-Date -Format 'yyyyMMdd').db"
```

### Changer un mot de passe

Double-cliquer sur **`changer-mot-de-passe.bat`** : le script liste les comptes,
demande l'adresse puis le nouveau mot de passe (8 caractères minimum).

> L'interface web ne propose pas cette opération : ce script est le seul moyen
> de changer un mot de passe.

### Débloquer un compte verrouillé

Après 5 échecs, le compte est bloqué 15 minutes. Pour lever le blocage
immédiatement, supprimer le contenu de `api/var/rate-limit/`.

### Consulter le journal d'audit

`api/var/audit/audit-AAAA-MM.log`, une ligne JSON par événement :

```json
{"date":"2026-08-25T17:08:39+00:00","evenement":"connexion_reussie","acteur":"admin@dirno.fr","contexte":{"ip":"127.0.0.1"}}
```

### Mettre à jour l'application

```bat
cd dirno-react
npm run build

cd ..\api
rmdir /s /q var\cache
php bin\console cache:warmup --env=prod --no-debug
```

> Le préchauffage du cache est **indispensable** : sans lui, la première requête
> après une mise à jour échoue en erreur 500. Le lanceur le fait automatiquement
> quand le cache est absent.

---

## 6. Développement

Deux serveurs, avec rechargement à chaud :

```bat
REM Terminal 1 — API
cd api
php -S 127.0.0.1:8000 -t public

REM Terminal 2 — front
cd dirno-react
npm run dev
```

Le front de développement est servi sur **http://localhost:5173/app/**.

Les limites réglementaires sont définies à deux endroits qui doivent rester
synchronisés :

- `api/src/Config/Limites.php` (référence)
- `dirno-react/src/constants.js`

L'application interroge `/api/config` au démarrage et **signale toute divergence
dans la console du navigateur**.
