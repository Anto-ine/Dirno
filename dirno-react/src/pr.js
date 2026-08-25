/**
 * Analyse d'un point repère routier.
 *
 * Sur le terrain un PR s'écrit « 12+500 » : borne 12, plus 500 m. Un simple
 * parseFloat("12+500") renvoie 12 et écrase l'abscisse, ce qui faisait tomber
 * dans le même tronçon tous les ouvrages d'une même borne kilométrique.
 *
 * Toutes les valeurs sont ramenées en mètres pour être comparables entre elles.
 */
export function parsePR(valeur) {
  if (valeur === null || valeur === undefined) return null;

  const texte = String(valeur).trim().replace(',', '.');
  if (texte === '') return null;

  // Format « borne+abscisse » : 12+500, 12 + 500, 12+0500
  const avecAbscisse = texte.match(/^(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)$/);
  if (avecAbscisse) {
    return parseFloat(avecAbscisse[1]) * 1000 + parseFloat(avecAbscisse[2]);
  }

  // Format simple : 12 ou 12.5 (kilomètres)
  const simple = texte.match(/^(\d+(?:\.\d+)?)$/);
  if (simple) {
    return parseFloat(simple[1]) * 1000;
  }

  return null;
}

/** Vrai si `pr` est compris dans l'intervalle [debut, fin], bornes dans n'importe quel ordre. */
export function prDansIntervalle(pr, debut, fin) {
  if (pr === null) return false;
  if (debut === null && fin === null) return true;
  if (debut === null) return pr <= fin;
  if (fin === null) return pr >= debut;
  return pr >= Math.min(debut, fin) && pr <= Math.max(debut, fin);
}
