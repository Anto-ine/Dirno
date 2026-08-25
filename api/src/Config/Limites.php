<?php

namespace App\Config;

/**
 * Source unique des limites réglementaires et du réseau autorisé.
 *
 * Toute modification ici doit être répercutée dans dirno-react/src/constants.js.
 * L'endpoint /api/config expose ces valeurs au front pour permettre de détecter
 * une désynchronisation entre les deux.
 */
final class Limites
{
    /** Limites dépendantes de la catégorie de convoi. */
    public const PAR_CATEGORIE = [
        'masse'    => ['1' => 48,  '2' => 72,  '3' => 120],
        'largeur'  => ['1' => 3.0, '2' => 4.0, '3' => 5.0],
        'longueur' => ['1' => 30,  '2' => 35,  '3' => 45],
    ];

    /** Gabarit en hauteur, identique pour toutes les catégories (en m). */
    public const HAUTEUR_MAX  = 4.75;
    public const HAUTEUR_WARN = 4.30;

    /** Charge maximale à l'essieu, toutes catégories (en t). */
    public const ESSIEU_MAX = 13;

    /** Seuil de proximité déclenchant un avertissement (90 % de la limite). */
    public const RATIO_WARN = 0.9;

    /** Réseau sur lequel un itinéraire peut être déclaré. */
    public const ROUTES = [
        'Autoroutes'        => ['A13', 'A28', 'A29', 'A131', 'A150', 'A151'],
        'Routes nationales' => ['N13', 'N15', 'N27', 'N28', 'N31', 'N138', 'N154', 'N814', 'N1013'],
    ];

    public const CATEGORIES = ['1', '2', '3'];

    /** Limite d'un critère pour une catégorie, ou null si la catégorie est inconnue. */
    public static function pour(string $critere, string $categorie): int|float|null
    {
        return self::PAR_CATEGORIE[$critere][$categorie] ?? null;
    }

    /** Liste à plat de toutes les routes autorisées. */
    public static function routesAutorisees(): array
    {
        return array_merge(...array_values(self::ROUTES));
    }

    public static function routeExiste(string $route): bool
    {
        return in_array(strtoupper(trim($route)), self::routesAutorisees(), true);
    }
}
