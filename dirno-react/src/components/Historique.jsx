import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch, authHeaders } from '../api';

export default function Historique({ token, onClose }) {
  const [convois, setConvois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiFetch('/api/historique', { headers: authHeaders(token) })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then(data => { setConvois(data); setLoading(false); })
      .catch(() => { setErreur('Impossible de charger l\'historique'); setLoading(false); });
  }, [token]);

  async function supprimerConvoi(id) {
    if (!window.confirm('Supprimer cette vérification ?')) return;
    const res = await apiFetch(`/api/convois/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    // Ne retirer de la liste que si le serveur a réellement supprimé.
    if (!res.ok) {
      setErreur('Suppression impossible — la vérification est toujours archivée.');
      return;
    }
    setConvois(convois.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  if (selected) {
    return (
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="section-label">
            <div className="step-num">📋</div>
            <span>Détail de la vérification #{selected.id}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-cta" style={{ maxWidth: '160px' }} onClick={() => window.print()}>📄 Exporter PDF</button>
            <button className="btn-muted" onClick={() => setSelected(null)}>← Retour</button>
          </div>
        </div>

        <div className="print-header">
          <div className="ph-left">DIRNO — Vérification Transport Exceptionnel</div>
          <div className="ph-right">
            Vérifié le {selected.createdAt}
            {selected.datePassage && ` · Passage prévu : ${selected.datePassage}`}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Informations du convoi</div>
          <div className="col-2" style={{ gap: '0.5rem' }}>
            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Catégorie : <strong style={{ color: '#e5e7eb' }}>Cat. {selected.categorie}</strong></div>
            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Masse : <strong style={{ color: '#e5e7eb' }}>{selected.masse} t</strong></div>
            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Largeur : <strong style={{ color: '#e5e7eb' }}>{selected.largeur} m</strong></div>
            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Hauteur : <strong style={{ color: '#e5e7eb' }}>{selected.hauteur} m</strong></div>
          </div>
          <div style={{ marginTop: '0.75rem', color: '#9ca3af', fontSize: '0.85rem' }}>
            Itinéraire :
            {selected.troncons.map((t, i) => (
              <span key={i}>
                <strong style={{ color: '#f97316' }}> {t.route}</strong>
                {t.prDebut && ` PR ${t.prDebut}`}
                {t.prFin && ` → ${t.prFin}`}
                {i < selected.troncons.length - 1 && ' ▸'}
              </span>
            ))}
          </div>
        </div>

        {selected.checks?.length > 0 && (
          <div className="card">
            <div className="card-title">Rapport de vérification</div>
            <div className={`result-banner result-banner--${selected.statut === 'pass' ? 'pass' : selected.statut === 'warning' ? 'warning' : 'fail'}`}>
              <strong>
                {selected.statut === 'pass' ? '✅ Convoi autorisé' : selected.statut === 'warning' ? '⚠️ Convoi sous réserve' : '❌ Convoi non conforme'}
              </strong>
            </div>
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
                {selected.checks.map((ch, i) => (
                  <tr key={i}>
                    <td><strong>{ch.critere}</strong></td>
                    <td>{ch.valeur}</td>
                    <td>{ch.limite}</td>
                    <td><span className={`badge badge--${ch.tag}`}>
                      {ch.tag === 'ok' ? 'Conforme' : ch.tag === 'ko' ? 'Non conforme' : 'Attention'}
                    </span></td>
                    <td style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{ch.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="section-label">
          <div className="step-num">📋</div>
          <span>Historique des vérifications</span>
        </div>
        <button className="btn-muted" onClick={onClose}>← Retour</button>
      </div>

      <div className="card">
        {loading && <p style={{ color: '#9ca3af', textAlign: 'center' }}>Chargement...</p>}
        {erreur && <p style={{ color: '#fca5a5', textAlign: 'center' }}>{erreur}</p>}
        {!loading && !erreur && convois.length === 0 && (
          <p style={{ color: '#9ca3af', textAlign: 'center' }}>Aucune vérification enregistrée.</p>
        )}
        {!loading && convois.length > 0 && (
          <table className="result-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Catégorie</th>
                <th>Masse</th>
                <th>Itinéraire</th>
                <th>Statut</th>
                <th>Passage prévu</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {convois.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: '#4b5563' }}>{c.id}</td>
                  <td>{c.createdAt}</td>
                  <td>Cat. {c.categorie}</td>
                  <td>{c.masse} t</td>
                  <td>
                    {c.troncons.map((t, i) => (
                      <span key={i}>
                        <span style={{ color: '#f97316' }}>{t.route}</span>
                        {i < c.troncons.length - 1 && ' ▸ '}
                      </span>
                    ))}
                  </td>
                  <td>
                    {c.statut === 'pass' && <span className="badge badge--ok">Autorisé</span>}
                    {c.statut === 'warning' && <span className="badge badge--warning">Sous réserve</span>}
                    {c.statut === 'fail' && <span className="badge badge--ko">Non conforme</span>}
                  </td>
                  <td style={{ color: '#9ca3af' }}>{c.datePassage || '—'}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSelected(c)}
                      style={{ background: 'transparent', border: '1px solid #2a2d3a', color: '#9ca3af', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      👁 Détail
                    </button>
                    <button
                      onClick={() => supprimerConvoi(c.id)}
                      style={{ background: 'transparent', border: '1px solid #dc2626', color: '#fca5a5', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}