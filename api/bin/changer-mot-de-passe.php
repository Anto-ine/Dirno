<?php

/**
 * Change le mot de passe d'un compte.
 *
 * L'interface web ne propose pas cette opération : ce script comble le manque
 * pour l'administrateur, notamment pour remplacer le mot de passe généré à
 * l'installation.
 */

$api  = dirname(__DIR__);
$base = $api . '/var/data.db';

if (!is_file($base)) {
    fwrite(STDERR, "Base de données introuvable. Lancez d'abord l'application.\n");
    exit(1);
}

$db = new PDO('sqlite:' . $base);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "\n  DIRNO — Changement de mot de passe\n";
echo "  =================================\n\n";

$comptes = $db->query('SELECT email, role FROM utilisateur ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
if ($comptes === []) {
    fwrite(STDERR, "Aucun compte enregistré.\n");
    exit(1);
}

echo "  Comptes existants :\n";
foreach ($comptes as $c) {
    echo '    - ' . $c['email'] . ' (' . $c['role'] . ")\n";
}
echo "\n";

$email = strtolower(trim((string) demander('  Adresse e-mail du compte : ')));

$compte = $db->prepare('SELECT id FROM utilisateur WHERE email = ?');
$compte->execute([$email]);
if (!$compte->fetchColumn()) {
    fwrite(STDERR, "\n  Aucun compte avec cette adresse.\n");
    exit(1);
}

$mdp = demander('  Nouveau mot de passe (8 caractères minimum) : ');
if (strlen($mdp) < 8) {
    fwrite(STDERR, "\n  Trop court : 8 caractères minimum.\n");
    exit(1);
}

if ($mdp !== demander('  Confirmer le mot de passe : ')) {
    fwrite(STDERR, "\n  Les deux saisies diffèrent.\n");
    exit(1);
}

$db->prepare('UPDATE utilisateur SET mot_de_passe = ? WHERE email = ?')
   ->execute([password_hash($mdp, PASSWORD_BCRYPT), $email]);

echo "\n  Mot de passe modifié pour " . $email . ".\n";
echo "  Les sessions ouvertes restent valides jusqu'à leur expiration (12 h).\n\n";

function demander(string $invite): string
{
    echo $invite;

    return rtrim((string) fgets(STDIN), "\r\n");
}
