import { motion } from 'framer-motion';
import { ROUTES } from '../constants';

export default function TronconCard({ index, troncon, onChange, onRemove, canRemove }) {
  function handleChange(field, value) {
    onChange({ ...troncon, [field]: value });
  }

  return (
    <motion.div
      className="troncon-card"
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96, height: 0, marginBottom: 0, padding: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="troncon-header">
        <div className="troncon-num">Tronçon {index + 1}</div>
        {canRemove && (
          <motion.button
            type="button"
            className="btn-remove-troncon"
            onClick={onRemove}
            title="Supprimer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ×
          </motion.button>
        )}
      </div>
      <div className="form-row">
        <label>Route</label>
        <select
          className="field"
          value={troncon.route}
          onChange={(e) => handleChange('route', e.target.value)}
        >
          <option value="">— Route —</option>
          {Object.entries(ROUTES).map(([group, routes]) => (
            <optgroup key={group} label={group}>
              {routes.map((r) => <option key={r} value={r}>{r}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="col-2">
        <div className="form-row">
          <label>PR début</label>
          <input
            type="text"
            className="field"
            placeholder="12+500"
            value={troncon.prDebut}
            onChange={(e) => handleChange('prDebut', e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>PR fin</label>
          <input
            type="text"
            className="field"
            placeholder="45+200"
            value={troncon.prFin}
            onChange={(e) => handleChange('prFin', e.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <label>Sens</label>
        <select
          className="field"
          value={troncon.sens}
          onChange={(e) => handleChange('sens', e.target.value)}
        >
          <option value="">— Sens —</option>
          <option value="croissant">PR croissants</option>
          <option value="decroissant">PR décroissants</option>
          <option value="les-deux">Les deux sens</option>
        </select>
      </div>
    </motion.div>
  );
}
