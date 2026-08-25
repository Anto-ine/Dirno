/**
 * Base de l'API.
 *
 * En production le front est servi par le serveur PHP lui-même (public/app) :
 * l'API est donc sur la même origine et les URL sont relatives, ce qui évite
 * toute URL codée en dur et rend le CORS inutile.
 *
 * En développement, le serveur Vite et le serveur PHP sont sur des ports
 * distincts, d'où la valeur par défaut vers le port 8000.
 *
 * VITE_API_URL permet de forcer une autre origine si besoin.
 */
const defautDev = 'http://localhost:8000';

export const API_URL = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? defautDev : '')
).replace(/\/$/, '');

export function apiUrl(chemin) {
  return `${API_URL}${chemin.startsWith('/') ? chemin : `/${chemin}`}`;
}

/** Entêtes d'authentification pour une requête JSON. */
export function authHeaders(token, avecJson = false) {
  return {
    ...(avecJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
}

/** Émis quand le serveur refuse le jeton : l'application repasse à l'écran de connexion. */
export const EVENEMENT_SESSION_EXPIREE = 'dirno:session-expiree';

/**
 * fetch pour les appels authentifiés.
 *
 * Un jeton peut être refusé avant son échéance (compte désactivé, secret
 * régénéré). Sans ce traitement, l'agent resterait sur une application qui
 * échoue silencieusement à chaque action.
 */
export async function apiFetch(chemin, options = {}) {
  const reponse = await fetch(apiUrl(chemin), options);

  if (reponse.status === 401) {
    window.dispatchEvent(new CustomEvent(EVENEMENT_SESSION_EXPIREE));
  }

  return reponse;
}
