import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function DropZone({ icon, label, description, onLoaded }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleFile(file) {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { range: 1 });
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        const result = { raw: data, columns, sheet, fileName: file.name };
        setFileInfo({ name: file.name, rows: data.length, cols: columns.length });
        onLoaded(result);
        toast.success(`${file.name} chargé — ${data.length} lignes`);
      } catch (err) {
        toast.error('Erreur de lecture : ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  }

  const loaded = !!fileInfo;

  return (
    <div>
      <motion.div
        className={`drop-zone${dragOver ? ' drag-over' : ''}${loaded ? ' loaded' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.15 }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="drop-icon spinner">⏳</div>
              <strong>Chargement…</strong>
            </motion.div>
          ) : loaded ? (
            <motion.div key="loaded"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="drop-icon">✅</div>
              <strong>{fileInfo.name}</strong>
              <p>Chargé avec succès</p>
            </motion.div>
          ) : (
            <motion.div key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="drop-icon">{icon}</div>
              <strong>{label}</strong>
              <p>{description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        className="file-input"
        accept=".xlsx,.xls,.ods,.csv"
        onChange={(e) => { if (e.target.files.length) handleFile(e.target.files[0]); }}
      />

      <AnimatePresence>
        {fileInfo && (
          <motion.div
            className="file-pill visible"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span>✅</span>
            <span className="fname">{fileInfo.name}</span>
            <span className="fstats">{fileInfo.rows} lignes · {fileInfo.cols} col.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
