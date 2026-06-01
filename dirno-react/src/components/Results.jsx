import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  pass:    { mod: 'pass',    icon: '✅', titre: 'Convoi autorisé',     desc: 'Toutes les vérifications sont conformes à la réglementation.' },
  warning: { mod: 'warning', icon: '⚠️', titre: 'Convoi sous réserve', desc: "Des points d'attention ont été relevés. Vérification complémentaire recommandée." },
  fail:    { mod: 'fail',    icon: '❌', titre: 'Convoi non conforme', desc: "Des dépassements ont été détectés. Le convoi ne peut pas circuler en l'état." },
};

function ResultRow({ check, index }) {
  const badgeLabel = check.tag === 'ok' ? 'Conforme' : check.tag === 'ko' ? 'Non conforme' : 'Attention';
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
    >
      <td><strong>{check.critere}</strong></td>
      <td>{check.valeur}</td>
      <td>{check.limite}</td>
      <td><span className={`badge badge--${check.tag}`}>{badgeLabel}</span></td>
      <td className="td-detail">{check.detail}</td>
    </motion.tr>
  );
}

export default function Results({ status, checks, troncons, datePassage }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (status) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [status, checks]);

  const printDate = 'Date de vérification : ' + new Date().toLocaleDateString('fr-FR') +
    ' · Passage prévu : ' + (datePassage ? new Date(datePassage).toLocaleDateString('fr-FR') : '—');

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="section-label">
            <motion.div
              className="step-num done"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            >
              ✓
            </motion.div>
            <span>Résultats</span>
          </div>
          <div className="card">
            <div className="results-toolbar">
              <div className="card-title">Rapport de vérification</div>
              <motion.button
                type="button"
                className="btn-export"
                onClick={() => window.print()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                📄 Exporter PDF
              </motion.button>
            </div>

            <motion.div
              className={`result-banner result-banner--${STATUS_CONFIG[status].mod}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.3 }}
            >
              <span className="result-big-icon">{STATUS_CONFIG[status].icon}</span>
              <div>
                <div className="result-title">{STATUS_CONFIG[status].titre}</div>
                <div className="result-desc">
                  {STATUS_CONFIG[status].desc}<br/>
                  {troncons.map((t, i) => {
                    let s = t.route;
                    if (t.prDebut) s += ' PR ' + t.prDebut;
                    if (t.prFin) s += ' → ' + t.prFin;
                    if (t.sens) s += ' (' + t.sens + ')';
                    return (
                      <span key={i}>
                        {i > 0 && <span style={{ margin: '0 6px', opacity: 0.5 }}>▸</span>}
                        <strong>{s}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <table className="result-table">
              <thead>
                <tr>
                  <th>Critère</th>
                  <th>Valeur convoi</th>
                  <th>Limite</th>
                  <th>Statut</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((ch, i) => <ResultRow key={i} check={ch} index={i} />)}
              </tbody>
            </table>

            <div className="print-header">
              <div className="ph-left">DIRNO — Vérification Transport Exceptionnel</div>
              <div className="ph-right">{printDate}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
