import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import {
  LIMITES,
  HAUTEUR_MAX,
  HAUTEUR_WARN,
  ESSIEU_MAX,
  RATIO_WARN,
  verifierSynchronisation,
} from './constants';
import { apiUrl, authHeaders, apiFetch, EVENEMENT_SESSION_EXPIREE } from './api';
import { parsePR, prDansIntervalle } from './pr';
import { lireSession, ecrireSession, effacerSession } from './session';
import Header from './components/Header';
import Hero from './components/Hero';
import Stepper from './components/Stepper';
import DropZone from './components/DropZone';
import Preview from './components/Preview';
import LiveHint from './components/LiveHint';
import TronconCard from './components/TronconCard';
import Results from './components/Results';
import Footer from './components/Footer';
import Login from './components/Login';
import Historique from './components/Historique';
import Admin from './components/Admin';

// Chaque tronçon porte un identifiant stable : indexer les clés React sur la
// position faisait dériver les animations quand on supprimait un tronçon du milieu.
let prochainTronconId = 0;
const nouveauTroncon = () => ({ id: ++prochainTronconId, route: '', prDebut: '', prFin: '', sens: '' });

function App() {
  // Session reprise depuis le navigateur : l'agent reste connecté d'une
  // ouverture à l'autre, jusqu'à l'expiration du jeton (12 h).
  // Lue une seule fois : deux appels séparés pourraient se contredire si la
  // session expirait entre les deux.
  const [sessionInitiale] = useState(lireSession);
  const [token, setToken] = useState(sessionInitiale?.token ?? null);
  const [utilisateur, setUtilisateur] = useState(sessionInitiale?.utilisateur ?? null);
  const [ouvrages, setOuvrages] = useState(null);
  const [reseau, setReseau] = useState(null);
  const [categorie, setCategorie] = useState('');
  const [masse, setMasse] = useState('');
  const [essieu, setEssieu] = useState('');
  const [largeur, setLargeur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [longueur, setLongueur] = useState('');
  const [vitesse, setVitesse] = useState('');
  const [datePassage, setDatePassage] = useState('');
  const [troncons, setTroncons] = useState([nouveauTroncon()]);
  const [resultStatus, setResultStatus] = useState(null);
  const [resultChecks, setResultChecks] = useState([]);
  const [resultTroncons, setResultTroncons] = useState([]);
  const [showHistorique, setShowHistorique] = useState(false);
const [showAdmin, setShowAdmin] = useState(false);

  const currentStep = resultStatus ? 3 : 2;

  // Le serveur peut refuser un jeton avant son échéance (compte désactivé,
  // secret régénéré) : on revient alors proprement à l'écran de connexion.
  useEffect(() => {
    function surSessionExpiree() {
      effacerSession();
      setToken(null);
      setUtilisateur(null);
      setShowHistorique(false);
      setShowAdmin(false);
      toast.error('Session expirée — veuillez vous reconnecter.');
    }

    window.addEventListener(EVENEMENT_SESSION_EXPIREE, surSessionExpiree);

    return () => window.removeEventListener(EVENEMENT_SESSION_EXPIREE, surSessionExpiree);
  }, []);

  // Alerte en console si les limites du front ont divergé de celles du serveur :
  // sans cela, un seul des deux côtés mis à jour passerait inaperçu.
  useEffect(() => {
    if (!token) return;
    fetch(apiUrl('/api/config'))
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => cfg && verifierSynchronisation(cfg))
      .catch(() => {});
  }, [token]);

  function handleLogin(tok, user) {
    ecrireSession(tok, user);
    setToken(tok);
    setUtilisateur(user);
  }

  function handleLogout() {
    effacerSession();
    setToken(null);
    setUtilisateur(null);
    setShowHistorique(false);
    setShowAdmin(false);
  }

  const ajouterTroncon = useCallback(() => {
    setTroncons((prev) => [...prev, nouveauTroncon()]);
  }, []);

  const supprimerTroncon = useCallback((id) => {
    setTroncons((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTroncon = useCallback((id, updated) => {
    setTroncons((prev) => prev.map((t) => (t.id === id ? { ...updated, id } : t)));
  }, []);

  function resetForm() {
    setCategorie('');
    setMasse('');
    setEssieu('');
    setLargeur('');
    setHauteur('');
    setLongueur('');
    setVitesse('');
    setDatePassage('');
    setTroncons([nouveauTroncon()]);
    setResultStatus(null);
    setResultChecks([]);
    setResultTroncons([]);
  }

  function verifierConvoi() {
    const cat = categorie;
    const m = parseFloat(masse);
    const l = parseFloat(largeur);
    const h = parseFloat(hauteur);
    const lo = parseFloat(longueur);
    const es = parseFloat(essieu);

    if (!cat || isNaN(m) || isNaN(l) || isNaN(h) || isNaN(lo)) {
      toast.error('Veuillez remplir tous les champs obligatoires : catégorie, masse et dimensions.');
      return;
    }

    const activeTroncons = troncons.filter((t) => t.route);
    if (activeTroncons.length === 0) {
      toast.error('Veuillez ajouter au moins un tronçon avec une route sélectionnée.');
      return;
    }

    const checks = [];
    let status = 'pass';

    const push = (critere, valeur, limite, tag, detail) => {
      checks.push({ critere, valeur, limite, tag, detail });
      if (tag === 'ko') status = 'fail';
      else if (tag === 'warning' && status !== 'fail') status = 'warning';
    };

    const lm = LIMITES.masse[cat];
    if (m > lm)                   push('Masse totale',     m + ' t',  lm + ' t',   'ko',      'Dépasse la limite de ' + lm + ' t');
    else if (m > lm * RATIO_WARN) push('Masse totale',     m + ' t',  lm + ' t',   'warning', 'Proche de la limite réglementaire');
    else                          push('Masse totale',     m + ' t',  lm + ' t',   'ok',      'Conforme');

    const ll = LIMITES.largeur[cat];
    if (l > ll)            push('Largeur hors tout', l + ' m',  ll + ' m',   'ko',      'Dépasse la limite de ' + ll + ' m');
    else                   push('Largeur hors tout', l + ' m',  ll + ' m',   'ok',      'Conforme');

    if (h > HAUTEUR_MAX)       push('Hauteur',           h + ' m',  '4,75 m',    'ko',      'Dépasse le gabarit maximal');
    else if (h > HAUTEUR_WARN) push('Hauteur',           h + ' m',  '4,75 m',    'warning', 'Vérifier les ouvrages sur le trajet');
    else                       push('Hauteur',           h + ' m',  '4,75 m',    'ok',      'Conforme');

    const llon = LIMITES.longueur[cat];
    if (lo > llon)         push('Longueur totale',   lo + ' m', llon + ' m', 'ko',      'Dépasse la limite de ' + llon + ' m');
    else                   push('Longueur totale',   lo + ' m', llon + ' m', 'ok',      'Conforme');

    if (!isNaN(es)) {
      if (es > ESSIEU_MAX) push('Charge essieu',     es + ' t', ESSIEU_MAX + ' t', 'ko', 'Dépasse la charge essieu maximale');
      else                 push('Charge essieu',     es + ' t', ESSIEU_MAX + ' t', 'ok', 'Conforme');
    }

    // Les contrôles d'ouvrages sont isolés : ils sont transmis au serveur pour
    // qu'il enregistre le même statut que celui affiché ici.
    const debutOuvrages = checks.length;

    if (ouvrages?.raw?.length) {
      const ouvragesConcernes = ouvrages.raw.filter((row) => {
        const voieOuvrage = String(row['Voie'] || row['voie'] || '').trim().toUpperCase();
        return activeTroncons.some((t) => {
          const voieTroncon = t.route.trim().toUpperCase();
          if (voieOuvrage !== voieTroncon) return false;
          const prOuvrage = parsePR(row['PR'] ?? row['pr']);
          return prDansIntervalle(prOuvrage, parsePR(t.prDebut), parsePR(t.prFin));
        });
      });

      if (ouvragesConcernes.length === 0) {
        push("Ouvrages d'art", 'Aucun ouvrage', '—', 'ok', 'Aucun ouvrage trouvé sur cet itinéraire');
      } else {
        let ouvrageKo = false;
        ouvragesConcernes.forEach((row) => {
          const limite = parseFloat(row['AutresConvoisEn tonnes'] || row['AutresConvois'] || 0);
          const nom = row['Nom'] || row['Identifiant'] || 'Ouvrage inconnu';
          const pr = row['PR'] || row['pr'] || '?';
          if (limite > 0 && m > limite) {
            push("Ouvrage PR " + pr, m + ' t', limite + ' t', 'ko', nom + ' — dépasse la limite');
            ouvrageKo = true;
          } else if (limite > 0 && m > limite * RATIO_WARN) {
            push("Ouvrage PR " + pr, m + ' t', limite + ' t', 'warning', nom + ' — proche de la limite');
          }
        });
        if (!ouvrageKo) {
          push("Ouvrages d'art", ouvragesConcernes.length + ' vérifiés', '—', 'ok', 'Tous les ouvrages sont conformes');
        }
      }
    } else {
      push("Ouvrages d'art", 'Base non chargée', '—', 'warning', 'Importer la base ODS pour vérifier les ouvrages');
    }

    const ouvrageChecks = checks.slice(debutOuvrages);

    setResultStatus(status);
    setResultChecks(checks);
    setResultTroncons(activeTroncons.map((t, i) => ({ ...t, num: i + 1 })));

    const msg = status === 'pass' ? 'Convoi autorisé ✅' : status === 'warning' ? 'Vérification sous réserve ⚠️' : 'Attention, vérifier la géométrie de l\'itinéraire ';
    if (status === 'pass') toast.success(msg);
    else if (status === 'warning') toast.warning(msg);
    else toast.error(msg);

    if (token) {
      const v = parseFloat(vitesse);

      apiFetch('/api/verifier', {
        method: 'POST',
        headers: authHeaders(token, true),
        body: JSON.stringify({
          categorie: cat,
          masse: m,
          essieu: isNaN(es) ? null : es,
          largeur: l,
          hauteur: h,
          longueur: lo,
          vitesse: isNaN(v) ? null : v,
          datePassage: datePassage || null,
          troncons: activeTroncons,
          ouvrageChecks,
        }),
      })
        .then(async (res) => {
          // Le cas 401 est traité globalement (retour à l'écran de connexion).
          if (res.ok || res.status === 401) return;
          // Un échec silencieux laisserait croire la vérification archivée.
          const data = await res.json().catch(() => ({}));
          toast.error('Vérification non archivée : ' + (data.erreur || `erreur ${res.status}`));
        })
        .catch(() => toast.error('Vérification non archivée : serveur injoignable.'));
    }
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Header utilisateur={utilisateur} onLogout={handleLogout} onHistorique={() => { setShowHistorique(true); setShowAdmin(false); }} onAdmin={() => { setShowAdmin(true); setShowHistorique(false); }} />

      <main className="page">
        {showHistorique ? (
  <Historique token={token} onClose={() => setShowHistorique(false)} />
) : showAdmin ? (
  <Admin token={token} onClose={() => setShowAdmin(false)} />
) : (
          <>
            <Hero />
            <div className="stepper-wrap">
              <Stepper current={currentStep} />
            </div>

            <div className="print-header">
              <div className="ph-left">DIRNO — Vérification Transport Exceptionnel</div>
              <div className="ph-right"></div>
            </div>

            <motion.div
              className="step1-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="section-label">
                <div className={`step-num${ouvrages || reseau ? ' done' : ''}`}>
                  {ouvrages || reseau ? '✓' : '1'}
                </div>
                <span>Bases de données</span>
              </div>
              <div className="card">
                <div className="card-title">Charger les fichiers de référence</div>
                <div className="grid-2">
                  <DropZone
                    icon="📋"
                    label="Ouvrages d'Art"
                    description="Glisser-déposer ou cliquer — .xlsx .ods"
                    onLoaded={setOuvrages}
                  />
                  <DropZone
                    icon="🗺️"
                    label="Réseau / Restrictions"
                    description="Glisser-déposer ou cliquer — .xlsx .ods"
                    onLoaded={setReseau}
                  />
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {(ouvrages || reseau) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <Preview ouvrages={ouvrages} reseau={reseau} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="step2-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="section-label">
                <div className="step-num">2</div>
                <span>Convoi &amp; itinéraire</span>
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-title">Dimensions et masse</div>

                  <div className="form-row">
                    <label>Catégorie du convoi</label>
                    <select className="field" value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      <option value="1">1ère catégorie</option>
                      <option value="2">2ème catégorie</option>
                      <option value="3">3ème catégorie</option>
                    </select>
                  </div>

                  <div className="col-2">
                    <div className="form-row">
                      <label>Masse totale <span className="unit">t</span></label>
                      <input type="number" className="field" placeholder="48" step="0.1" min="0"
                        value={masse} onChange={(e) => setMasse(e.target.value)} />
                      <LiveHint field="masse" value={masse} categorie={categorie} />
                    </div>
                    <div className="form-row">
                      <label>Essieu max <span className="unit">t</span></label>
                      <input type="number" className="field" placeholder="13" step="0.1" min="0"
                        value={essieu} onChange={(e) => setEssieu(e.target.value)} />
                      <LiveHint field="essieu" value={essieu} categorie={categorie} />
                    </div>
                  </div>

                  <div className="col-2">
                    <div className="form-row">
                      <label>Largeur <span className="unit">m</span></label>
                      <input type="number" className="field" placeholder="3.50" step="0.01" min="0"
                        value={largeur} onChange={(e) => setLargeur(e.target.value)} />
                      <LiveHint field="largeur" value={largeur} categorie={categorie} />
                    </div>
                    <div className="form-row">
                      <label>Hauteur <span className="unit">m</span></label>
                      <input type="number" className="field" placeholder="4.20" step="0.01" min="0"
                        value={hauteur} onChange={(e) => setHauteur(e.target.value)} />
                      <LiveHint field="hauteur" value={hauteur} categorie={categorie} />
                    </div>
                  </div>

                  <div className="col-2">
                    <div className="form-row">
                      <label>Longueur <span className="unit">m</span></label>
                      <input type="number" className="field" placeholder="25" step="0.01" min="0"
                        value={longueur} onChange={(e) => setLongueur(e.target.value)} />
                      <LiveHint field="longueur" value={longueur} categorie={categorie} />
                    </div>
                    <div className="form-row">
                      <label>Vitesse <span className="unit">km/h</span></label>
                      <input type="number" className="field" placeholder="70" step="1" min="0"
                        value={vitesse} onChange={(e) => setVitesse(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">Itinéraire</div>

                  <AnimatePresence>
                    {troncons.map((t, i) => (
                      <TronconCard
                        key={t.id}
                        index={i}
                        troncon={t}
                        onChange={(updated) => updateTroncon(t.id, updated)}
                        onRemove={() => supprimerTroncon(t.id)}
                        canRemove={troncons.length > 1}
                      />
                    ))}
                  </AnimatePresence>

                  <motion.button
                    type="button"
                    className="btn-add-troncon"
                    onClick={ajouterTroncon}
                    whileHover={{ borderColor: '#f97316', color: '#f97316' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    + Ajouter un tronçon
                  </motion.button>

                  <div className="form-row">
                    <label>Date prévisionnelle</label>
                    <input type="date" className="field" value={datePassage} onChange={(e) => setDatePassage(e.target.value)} />
                  </div>

                  <div className="btn-wrap">
                    <motion.button
                      type="button"
                      className="btn-cta"
                      onClick={verifierConvoi}
                      whileHover={{ boxShadow: '0 4px 20px rgba(249,115,22,0.5)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Lancer la vérification →
                    </motion.button>
                    <motion.button
                      type="button"
                      className="btn-muted"
                      onClick={resetForm}
                      whileTap={{ scale: 0.97 }}
                    >
                      Réinitialiser
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            <Results
              status={resultStatus}
              checks={resultChecks}
              troncons={resultTroncons}
              datePassage={datePassage}
            />
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

export default App;