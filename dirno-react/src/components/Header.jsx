export default function Header({ utilisateur, onLogout, onHistorique, onAdmin }) {
  return (
    <header>
      <div className="header-inner">
        <div className="wordmark">
          <div className="wordmark-dot">
            <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="wordmark-text"><strong>DIRNO</strong></div>
            <div className="wordmark-sub">Transports Exceptionnels</div>
          </div>
        </div>
        <div className="header-right">
          
          {utilisateur && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={onHistorique} style={{ background: 'transparent', border: '1px solid #2a2d3a', color: '#9ca3af', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>
                📋 Historique
              </button>
              {utilisateur.role === 'admin' && (
                <button onClick={onAdmin} style={{ background: 'transparent', border: '1px solid #2a2d3a', color: '#9ca3af', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  ⚙️ Admin
                </button>
              )}
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>👤 {utilisateur.nom}</span>
              <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #2a2d3a', color: '#9ca3af', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}