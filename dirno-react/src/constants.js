/**
 * Limites réglementaires et réseau autorisé.
 *
 * ⚠ Ces valeurs doivent rester identiques à api/src/Config/Limites.php.
 * L'application interroge /api/config au démarrage et signale en console toute
 * divergence entre le front et le back (voir verifierSynchronisation).
 */
export const ROUTES = {
  'Autoroutes': ['A13', 'A28', 'A29', 'A131', 'A150', 'A151'],
  'Routes nationales': ['N13', 'N15', 'N27', 'N28', 'N31', 'N138', 'N154', 'N814', 'N1013']
};

export const LIMITES = {
  masse:    { '1': 48,  '2': 72,  '3': 120 },
  largeur:  { '1': 3.0, '2': 4.0, '3': 5.0 },
  longueur: { '1': 30,  '2': 35,  '3': 45 }
};

export const HAUTEUR_MAX = 4.75;
export const HAUTEUR_WARN = 4.30;
export const ESSIEU_MAX = 13;
export const RATIO_WARN = 0.9;

/**
 * Compare les limites locales à celles du serveur et alerte en cas d'écart.
 * Une divergence signifie qu'un seul des deux côtés a été mis à jour : le
 * résultat affiché à l'agent ne correspondrait plus à ce qui est archivé.
 */
export function verifierSynchronisation(configServeur) {
  if (!configServeur?.limites) return [];

  const ecarts = [];
  for (const [critere, parCategorie] of Object.entries(LIMITES)) {
    for (const [cat, valeur] of Object.entries(parCategorie)) {
      const cote = configServeur.limites?.[critere]?.[cat];
      if (cote !== undefined && Number(cote) !== Number(valeur)) {
        ecarts.push(`${critere} cat.${cat} : front ${valeur} ≠ serveur ${cote}`);
      }
    }
  }

  if (ecarts.length) {
    console.error(
      '[DIRNO] Limites désynchronisées entre le front et le serveur :\n' + ecarts.join('\n') +
      '\nMettre à jour src/constants.js et api/src/Config/Limites.php.'
    );
  }

  return ecarts;
}
