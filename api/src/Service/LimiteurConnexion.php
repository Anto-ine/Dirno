<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Limitation des tentatives de connexion (anti-bruteforce).
 *
 * Sans ce garde-fou, /api/login accepte un nombre illimité d'essais : un mot de
 * passe faible tombe en quelques minutes. Le compteur est stocké sur disque pour
 * survivre au redémarrage du serveur, et indexé sur le couple email + IP.
 */
class LimiteurConnexion
{
    /** Nombre d'échecs tolérés avant blocage temporaire. */
    private const MAX_ESSAIS = 5;

    /** Durée du blocage, en secondes. */
    private const DUREE_BLOCAGE = 900;

    /** Fenêtre d'observation des échecs, en secondes. */
    private const FENETRE = 900;

    public function __construct(
        #[Autowire('%kernel.project_dir%/var/rate-limit')]
        private readonly string $dossier,
    ) {
    }

    /** Secondes restantes avant de pouvoir réessayer, ou 0 si la voie est libre. */
    public function secondesAvantReessai(string $identifiant): int
    {
        $etat = $this->lire($identifiant);
        if ($etat === null || $etat['essais'] < self::MAX_ESSAIS) {
            return 0;
        }

        $restant = ($etat['dernier'] + self::DUREE_BLOCAGE) - time();

        return max(0, $restant);
    }

    public function enregistrerEchec(string $identifiant): void
    {
        $etat = $this->lire($identifiant);

        // Au-delà de la fenêtre d'observation, on repart de zéro.
        if ($etat === null || (time() - $etat['dernier']) > self::FENETRE) {
            $etat = ['essais' => 0, 'dernier' => time()];
        }

        $etat['essais']++;
        $etat['dernier'] = time();

        $this->ecrire($identifiant, $etat);
    }

    public function reinitialiser(string $identifiant): void
    {
        $fichier = $this->fichier($identifiant);
        if (is_file($fichier)) {
            @unlink($fichier);
        }
    }

    /** @return array{essais: int, dernier: int}|null */
    private function lire(string $identifiant): ?array
    {
        $fichier = $this->fichier($identifiant);
        if (!is_file($fichier)) {
            return null;
        }

        $donnees = json_decode((string) @file_get_contents($fichier), true);

        return is_array($donnees) && isset($donnees['essais'], $donnees['dernier']) ? $donnees : null;
    }

    /** @param array{essais: int, dernier: int} $etat */
    private function ecrire(string $identifiant, array $etat): void
    {
        if (!is_dir($this->dossier) && !@mkdir($this->dossier, 0700, true) && !is_dir($this->dossier)) {
            return;
        }

        @file_put_contents($this->fichier($identifiant), json_encode($etat), LOCK_EX);
    }

    private function fichier(string $identifiant): string
    {
        // Hachage : le journal de blocage ne contient aucune adresse en clair.
        return $this->dossier . '/' . hash('sha256', $identifiant) . '.json';
    }
}
