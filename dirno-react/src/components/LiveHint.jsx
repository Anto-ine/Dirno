import { LIMITES } from '../constants';

const HINT_CONFIG = {
  masse:    { limit: (cat) => LIMITES.masse[cat],    unit: 't', warnRatio: 0.9 },
  essieu:   { limit: () => 13,                       unit: 't', warnRatio: 0.9 },
  largeur:  { limit: (cat) => LIMITES.largeur[cat],  unit: 'm', warnRatio: 1.0 },
  hauteur:  { limit: () => 4.75,                     unit: 'm', warnRatio: 4.30 / 4.75 },
  longueur: { limit: (cat) => LIMITES.longueur[cat], unit: 'm', warnRatio: 1.0 },
};

export default function LiveHint({ field, value, categorie }) {
  const config = HINT_CONFIG[field];
  if (!config || !categorie) return <div className="live-hint" />;

  const val = parseFloat(value);
  if (isNaN(val) || val <= 0) return <div className="live-hint" />;

  const limit = config.limit(categorie);
  let cls, text;

  if (val > limit) {
    cls = 'hint-ko';
    text = `Depasse la limite de ${limit} ${config.unit}`;
  } else if (val > limit * config.warnRatio) {
    cls = 'hint-warn';
    text = `Proche de la limite (${limit} ${config.unit})`;
  } else {
    cls = 'hint-ok';
    text = `OK — limite ${limit} ${config.unit}`;
  }

  return (
    <div className={`live-hint visible ${cls}`}>
      <span className="hint-dot"></span>
      <span className="hint-text">{text}</span>
    </div>
  );
}
