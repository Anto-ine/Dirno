import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Admin({ token, onClose }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', motDePasse: '', role: 'agent' });

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  async function chargerUtilisateurs() {
    try {
      const res = await fetch('http://localhost:8000/api/admin/utilisateurs', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      setUtilisateurs(data);
    } catch {
      toast.error('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  }

  async function creerUtilisateur(e) {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/admin/utilisateurs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.erreur || 'Erreur lors de la création');
        return;
      }
      toast.success('Utilisateur créé !');
      setForm({ nom: '', email: '', motDePasse: '', role: 'agent' });
      setShowForm(false);
      chargerUtilisateurs();
    } catch {
      toast.error('Erreur réseau');
    }
  }
async function supprimerUtilisateur(id, nom) {
    if (!window.confirm(`Supprimer définitivement le compte de ${nom} ?`)) return;
    try {
      await fetch(`http://localhost:8000/api/admin/utilisateurs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      toast.success('Utilisateur supprimé');
      chargerUtilisateurs();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }
  async function toggleUtilisateur(id) {
    try {
      await fetch(`http://localhost:8000/api/admin/utilisateurs/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      chargerUtilisateurs();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="section-label">
          <div className="step-num">⚙️</div>
          <span>Administration — Gestion des utilisateurs</span>
        </div>
        <button className="btn-muted" onClick={onClose}>← Retour</button>
      </div>

      {/* Bouton créer */}
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn-cta" style={{ maxWidth: '220px' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Annuler' : '+ Nouvel utilisateur'}
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <motion.div
          className="card"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ marginBottom: '1.5rem' }}
        >
          <div className="card-title">Créer un compte</div>
          <form onSubmit={creerUtilisateur}>
            <div className="col-2">
              <div className="form-row">
                <label>Nom complet</label>
                <input type="text" className="field" placeholder="Jean Dupont"
                  value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input type="email" className="field" placeholder="jean.dupont@dirno.fr"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-row">
                <label>Mot de passe</label>
                <input type="password" className="field" placeholder="••••••••"
                  value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} required />
              </div>
              <div className="form-row">
                <label>Rôle</label>
                <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="agent">Agent</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn-cta" style={{ maxWidth: '200px' }}>
                Créer le compte →
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Liste utilisateurs */}
      <div className="card">
        <div className="card-title">Comptes utilisateurs ({utilisateurs.length})</div>
        {loading && <p style={{ color: '#9ca3af' }}>Chargement...</p>}
        {!loading && (
          <table className="result-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Créé le</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.nom}</strong></td>
                  <td style={{ color: '#9ca3af' }}>{u.email}</td>
                  <td>
                    <span className={u.role === 'admin' ? 'badge badge--warning' : 'badge badge--ok'}>
                      {u.role === 'admin' ? 'Admin' : 'Agent'}
                    </span>
                  </td>
                  <td style={{ color: '#9ca3af' }}>{u.createdAt}</td>
                  <td>
                    <span className={u.actif ? 'badge badge--ok' : 'badge badge--ko'}>
                      {u.actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  
               <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleUtilisateur(u.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #2a2d3a',
                        color: u.actif ? '#fca5a5' : '#86efac',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {u.actif ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => supprimerUtilisateur(u.id, u.nom)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #dc2626',
                        color: '#fca5a5',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
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
