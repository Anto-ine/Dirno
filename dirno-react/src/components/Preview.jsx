import { useState } from 'react';

export default function Preview({ ouvrages, reseau }) {
  const [activeTab, setActiveTab] = useState('ouvrages');

  if (!ouvrages && !reseau) return null;

  const data = activeTab === 'ouvrages' ? ouvrages : reseau;

  return (
    <div className="card">
      <div className="card-title">Apercu des donnees importees</div>
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn${activeTab === 'ouvrages' ? ' active' : ''}`}
          onClick={() => setActiveTab('ouvrages')}
        >
          Ouvrages d&apos;Art
        </button>
        <button
          type="button"
          className={`tab-btn${activeTab === 'reseau' ? ' active' : ''}`}
          onClick={() => setActiveTab('reseau')}
        >
          Reseau / Restrictions
        </button>
      </div>
      <div className="data-preview">
        {!data ? (
          <p className="data-empty">Base non chargee.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  {data.columns.map((c) => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.raw.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    {data.columns.map((c) => (
                      <td key={c}>{row[c] !== undefined ? String(row[c]) : ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.raw.length > 50 && (
              <p className="data-empty">Affichage limite a 50 lignes sur {data.raw.length}.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
