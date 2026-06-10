import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.erreur || 'Erreur de connexion');
        return;
      }

      toast.success('Bienvenue ' + data.utilisateur.nom + ' !');
      onLogin(data.token, data.utilisateur);

    } catch (err) {
      toast.error('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1117'
    }}>
      <motion.div
        className="card"
        style={{ width: '100%', maxWidth: '400px' }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f3f4f6' }}>DIRNO</div>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Transports Exceptionnels</div>
        </div>

        <div className="card-title">Connexion</div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email</label>
            <input
              type="email"
              className="field"
              placeholder="agent@dirno.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label>Mot de passe</label>
            <input
              type="password"
              className="field"
              placeholder="••••••••"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn-cta"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#4b5563' }}>
          Accès réservé aux agents DIR NO
        </div>
      </motion.div>
    </div>
  );
}
