<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Journal d'audit : trace les événements sensibles (connexions, échecs,
 * suppressions, gestion des comptes) dans un fichier horodaté.
 *
 * La traçabilité des accès et des suppressions est une exigence récurrente des
 * référentiels de sécurité de l'administration. Le journal est en append-only
 * côté application et ne contient jamais de mot de passe.
 */
class JournalAudit
{
    public function __construct(
        #[Autowire('%kernel.project_dir%/var/audit')]
        private readonly string $dossier,
    ) {
    }

    /**
     * @param array<string, scalar|null> $contexte
     */
    public function enregistrer(string $evenement, ?string $acteur, array $contexte = []): void
    {
        $ligne = json_encode([
            'date'      => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'evenement' => $evenement,
            'acteur'    => $acteur ?? 'anonyme',
            'contexte'  => $contexte,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($ligne === false) {
            return;
        }

        if (!is_dir($this->dossier) && !@mkdir($this->dossier, 0700, true) && !is_dir($this->dossier)) {
            return;
        }

        // Un journal par mois : lisible, et facile à archiver ou purger.
        $fichier = sprintf('%s/audit-%s.log', $this->dossier, date('Y-m'));

        // La journalisation ne doit jamais faire échouer la requête métier.
        @file_put_contents($fichier, $ligne . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}
