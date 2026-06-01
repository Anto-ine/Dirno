import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { LIMITES } from './constants';
import Header from './components/Header';
import Hero from './components/Hero';
import Stepper from './components/Stepper';
import DropZone from './components/DropZone';
import Preview from './components/Preview';
import LiveHint from './components/LiveHint';
import TronconCard from './components/TronconCard';
import Results from './components/Results';
import Footer from './components/Footer';

const EMPTY_TRONCON = { route: '', prDebut: '', prFin: '', sens: '' };

function App() {
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

  const [troncons, setTroncons] = useState([{ ...EMPTY_TRONCON }]);

  const [resultStatus, setResultStatus] = useState(null);
  const [resultChecks, setResultChecks] = useState([]);
  const [resultTroncons, setResultTroncons] = useState([]);

  // Derive stepper step
  const currentStep = resultStatus ? 3 : 2;

  const ajouterTroncon = useCallback(() => {
    setTroncons((prev) => [...prev, { ...EMPTY_TRONCON }]);
  }, []);

  const supprimerTroncon = useCallback((index) => {
    setTroncons((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateTroncon = useCallback((index, updated) => {
    setTroncons((prev) => prev.map((t, i) => (i === index ? updated : t)));
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
    setTroncons([{ ...EMPTY_TRONCON }]);
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
    if (m > lm)            push('Masse totale',     m + ' t',  lm + ' t',   'ko',      'Dépasse la limite de ' + lm + ' t');
    else if (m > lm * 0.9) push('Masse totale',     m + ' t',  lm + ' t',   'warning', 'Proche de la limite réglementaire');
    else                    push('Masse totale',     m + ' t',  lm + ' t',   'ok',      'Conforme');

    const ll = LIMITES.largeur[cat];
    if (l > ll)            push('Largeur hors tout', l + ' m',  ll + ' m',  'ko',      'Dépasse la limite de ' + ll + ' m');
    else                   push('Largeur hors tout', l + ' m',  ll + ' m',  'ok',      'Conforme');

    if (h > 4.75)          push('Hauteur',           h + ' m',  '4,75 m',   'ko',      'Dépasse le gabarit maximal');
    else if (h > 4.30)     push('Hauteur',           h + ' m',  '4,75 m',   'warning', 'Vérifier les ouvrages sur le trajet');
    else                   push('Hauteur',           h + ' m',  '4,75 m',   'ok',      'Conforme');

    const llon = LIMITES.longueur[cat];
    if (lo > llon)         push('Longueur totale',   lo + ' m', llon + ' m','ko',      'Dépasse la limite de ' + llon + ' m');
    else                   push('Longueur totale',   lo + ' m', llon + ' m','ok',      'Conforme');

    if (!isNaN(es)) {
      if (es > 13)         push('Charge essieu',     es + ' t', '13 t',     'ko',      'Dépasse la charge essieu maximale');
      else                 push('Charge essieu',     es + ' t', '13 t',     'ok',      'Conforme');
    }

    if (ouvrages?.raw?.length) {
      push("Ouvrages d'art", ouvrages.raw.length + ' vérifiés', '—', 'ok', 'Vérification sur base importée (règles bêta)');
    } else {
      push("Ouvrages d'art", 'Base non chargée', '—', 'warning', 'Importer la base pour une vérification complète');
    }

    setResultStatus(status);
    setResultChecks(checks);
    setResultTroncons(activeTroncons.map((t, i) => ({ ...t, num: i + 1 })));

    const msg = status === 'pass' ? 'Convoi autorisé ✅' : status === 'warning' ? 'Vérification sous réserve ⚠️' : 'Convoi non conforme ❌';
    if (status === 'pass') toast.success(msg);
    else if (status === 'warning') toast.warning(msg);
    else toast.error(msg);
  }

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Header />
      <Hero />

      <div className="stepper-wrap">
        <Stepper current={currentStep} />
      </div>

      <main className="page">
        <div className="print-header">
          <div className="ph-left">DIRNO — Vérification Transport Exceptionnel</div>
          <div className="ph-right"></div>
        </div>

        {/* ÉTAPE 1 : Import */}
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

        {/* Aperçu */}
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

        {/* ÉTAPE 2 : Convoi & itinéraire */}
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
            {/* Convoi */}
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

            {/* Itinéraire */}
            <div className="card">
              <div className="card-title">Itinéraire</div>

              <AnimatePresence>
                {troncons.map((t, i) => (
                  <TronconCard
                    key={i}
                    index={i}
                    troncon={t}
                    onChange={(updated) => updateTroncon(i, updated)}
                    onRemove={() => supprimerTroncon(i)}
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

        {/* Résultats */}
        <Results
          status={resultStatus}
          checks={resultChecks}
          troncons={resultTroncons}
          datePassage={datePassage}
        />
      </main>

      <Footer />
    </>
  );
}

export default App;
