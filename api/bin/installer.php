<?php

/**
 * Installation au premier lancement.
 *
 * Écrit en PHP plutôt qu'en script batch : la génération du secret et du mot de
 * passe demande des parenthèses et des caractères spéciaux que cmd.exe gère mal
 * (une première version en .bat produisait un secret vide).
 *
 * Idempotent : chaque étape est ignorée si elle est déjà faite.
 */

$api    = dirname(__DIR__);
$racine = dirname($api);

$fait = [];

// --- 1. Secret propre à cette installation --------------------------------
$envLocal = $api . '/.env.local';

if (!is_file($envLocal)) {
    $secret = bin2hex(random_bytes(32));

    file_put_contents($envLocal, implode("\n", [
        '# Configuration de cette installation — généré le ' . date('Y-m-d H:i'),
        '# Ne pas diffuser : APP_SECRET signe les jetons de connexion.',
        'APP_ENV=prod',
        'APP_DEBUG=0',
        'APP_SECRET=' . $secret,
        '',
    ]));

    $fait[] = 'secret';
}

// --- 2. Base de données ----------------------------------------------------
$baseFichier = $api . '/var/data.db';

if (!is_file($baseFichier)) {
    if (!is_dir($api . '/var')) {
        mkdir($api . '/var', 0700, true);
    }

    $db = new PDO('sqlite:' . $baseFichier);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    foreach (explode(';', file_get_contents($api . '/database_sqlite.sql')) as $requete) {
        if (trim($requete) !== '') {
            $db->exec($requete);
        }
    }

    // Le jeu de données livré contient un mot de passe d'exemple qui ne
    // correspond à rien : sans cette étape, personne ne peut se connecter.
    // On génère un mot de passe unique par installation.
    $motDePasse = genererMotDePasse();

    $db->prepare('DELETE FROM utilisateur WHERE email = ?')->execute(['admin@dirno.fr']);
    $db->prepare(
        'INSERT INTO utilisateur (nom, email, mot_de_passe, role, actif, created_at) VALUES (?, ?, ?, ?, 1, ?)'
    )->execute([
        'Administrateur',
        'admin@dirno.fr',
        password_hash($motDePasse, PASSWORD_BCRYPT),
        'admin',
        date('Y-m-d H:i:s'),
    ]);

    // BOM UTF-8 : sans lui, le Bloc-notes affiche les accents en caractères illisibles.
    // BOM UTF-8 : sans lui, le Bloc-notes affiche les accents en caractères illisibles.
    file_put_contents($racine . '/MOT-DE-PASSE-INITIAL.txt', "\xEF\xBB\xBF" . implode("\r\n", [
        'DIRNO — Mot de passe initial (à usage du technicien)',
        '====================================================',
        '',
        '    Adresse e-mail : admin@dirno.fr',
        '    Mot de passe   : ' . $motDePasse,
        '',
        'Généré aléatoirement pour ce poste le ' . date('d/m/Y à H:i') . '.',
        '',
        'Définir le mot de passe définitif avec changer-mot-de-passe.bat,',
        'puis supprimer ce fichier.',
        '',
    ]));

    $fait[] = 'base';
}

echo $fait === [] ? "Installation déjà effectuée.\n" : 'Installation : ' . implode(', ', $fait) . ".\n";

/**
 * Mot de passe lisible mais robuste : 4 groupes de 4 caractères sans
 * caractères ambigus (0/O, 1/l/I), soit environ 10^25 combinaisons.
 */
function genererMotDePasse(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    $groupes  = [];

    for ($g = 0; $g < 4; $g++) {
        $groupe = '';
        for ($i = 0; $i < 4; $i++) {
            $groupe .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $groupes[] = $groupe;
    }

    return implode('-', $groupes);
}
