/**
 * Persistance de la session dans le navigateur.
 *
 * Le jeton était conservé en mémoire uniquement : l'agent devait ressaisir son
 * mot de passe à chaque ouverture de l'application, et même à chaque
 * rafraîchissement de page. Il est désormais mémorisé localement jusqu'à son
 * expiration (12 h côté serveur).
 *
 * Le stockage est propre à l'origine 127.0.0.1:8000 et reste sur ce poste :
 * il ne transite jamais sur le réseau.
 */
const CLE = 'dirno.session';

/** @returns {{token: string, utilisateur: object}|null} */
export function lireSession() {
  let brut;
  try {
    brut = localStorage.getItem(CLE);
  } catch {
    // Navigation privée ou stockage désactivé : on repart d'une session vide.
    return null;
  }

  if (!brut) return null;

  try {
    const session = JSON.parse(brut);
    if (!session?.token || !session?.utilisateur) return null;

    // Inutile d'afficher l'application avec un jeton déjà périmé : le serveur
    // le refuserait à la première requête.
    if (expirationDe(session.token) <= Date.now()) {
      effacerSession();
      return null;
    }

    return session;
  } catch {
    effacerSession();
    return null;
  }
}

export function ecrireSession(token, utilisateur) {
  try {
    localStorage.setItem(CLE, JSON.stringify({ token, utilisateur }));
  } catch {
    // Le stockage peut être indisponible : la session reste alors en mémoire.
  }
}

export function effacerSession() {
  try {
    localStorage.removeItem(CLE);
  } catch {
    // Rien à faire : la session est de toute façon abandonnée côté React.
  }
}

/**
 * Date d'expiration portée par le jeton, en millisecondes.
 * Le jeton vaut base64url("id:email:expiration") + "." + signature ; la
 * signature n'est vérifiable que par le serveur, on ne lit ici que l'échéance.
 */
function expirationDe(token) {
  try {
    const charge = token.split('.')[0];
    const base64 = charge.replace(/-/g, '+').replace(/_/g, '/');
    const complet = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const expiration = Number(atob(complet).split(':')[2]);

    return Number.isFinite(expiration) ? expiration * 1000 : 0;
  } catch {
    return 0;
  }
}
