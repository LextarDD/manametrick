import React, { useState, useRef } from 'react';
import Modal from '../shared/Modal';

// Parsea score "2-0", "2-1", "0-2", "1-2" → result win/loss
const scoreToResult = (score) => {
  if (!score) return null;
  const s = score.trim();
  if (s === '2-0' || s === '2-1') return 'win';
  if (s === '0-2' || s === '1-2') return 'loss';
  return null;
};

const parseCSV = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ['El archivo está vacío o no tiene datos.'] };

  // Detectar separador
  const sep = lines[0].includes(';') ? ';' : ',';

  const parseRow = (line) => {
    const cols = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (c === sep && !inQuote) {
        cols.push(cur.trim()); cur = '';
      } else {
        cur += c;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-záéíóúñ_\s]/gi, '').trim());

  // Mapeo flexible de columnas
  const idx = (names) => {
    for (const n of names) {
      const i = headers.findIndex(h => h.includes(n));
      if (i !== -1) return i;
    }
    return -1;
  };

  const colFecha        = idx(['fecha']);
  const colMazo         = idx(['mazo']);
  const colArqPropio    = idx(['propio', 'arquetipo propio']);
  const colArqRival     = idx(['rival', 'arquetipo rival']);
  const colOponente     = idx(['oponente']);
  const colScore        = idx(['score']);
  const colTorneo       = idx(['torneo']);
  const colNota         = idx(['nota']);
  const colTournamentId = idx(['_tournament_id', 'tournament_id']);

  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    const get = (ci) => (ci !== -1 && cols[ci] ? cols[ci].trim() : '');

    const arquetipo      = get(colArqPropio);
    const oppArchetype   = get(colArqRival);
    const score          = get(colScore);
    const result         = scoreToResult(score);

    // Validación de campos obligatorios
    const rowErrors = [];
    if (!arquetipo)    rowErrors.push('falta arquetipo propio');
    if (!oppArchetype) rowErrors.push('falta arquetipo rival');
    if (!result)       rowErrors.push(`score inválido: "${score}" (usa 2-0, 2-1, 0-2 o 1-2)`);

    if (rowErrors.length > 0) {
      errors.push(`Fila ${i + 1}: ${rowErrors.join(', ')}`);
      continue;
    }

    // Fecha
    let createdAt = new Date().toISOString();
    const fechaStr = get(colFecha);
    if (fechaStr) {
      // Soporta dd/mm/yyyy y yyyy-mm-dd
      const parts = fechaStr.includes('/') ? fechaStr.split('/').reverse().join('-') : fechaStr;
      const d = new Date(parts);
      if (!isNaN(d)) createdAt = d.toISOString();
    }

    rows.push({
      _rowNum: i + 1,
      created_at:         createdAt,
      deck_name:          get(colMazo) || '',
      archetype:          arquetipo,
      opponent_archetype: oppArchetype,
      opponent_name:      get(colOponente) || '',
      score,
      result,
      tournament_name:    get(colTorneo) || '',
      note:               get(colNota) || '',
      _tournament_id_orig: get(colTournamentId) || '',
    });
  }

  return { rows, errors };
};

// Agrupa filas por tournament_id original → asigna nuevo UUID compartido
// Si no hay tournament_id → partida suelta
const groupByTournament = (rows) => {
  const grouped = {};  // orig_id → [rows]
  const loose   = [];

  rows.forEach(row => {
    if (row._tournament_id_orig) {
      if (!grouped[row._tournament_id_orig]) grouped[row._tournament_id_orig] = [];
      grouped[row._tournament_id_orig].push(row);
    } else {
      loose.push(row);
    }
  });

  return { grouped, loose };
};

const ImportGamesModal = ({ onClose, onImport }) => {
  const [step, setStep] = useState('upload');   // upload | preview | importing | done
  const [parsed, setParsed] = useState(null);   // { rows, errors }
  const [fileError, setFileError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const result = parseCSV(text);
      if (result.rows.length === 0 && result.errors.length > 0) {
        setFileError('No se encontraron filas válidas. Revisa el formato del archivo.');
        return;
      }
      setParsed(result);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setStep('importing');

    const { grouped, loose } = groupByTournament(parsed.rows);
    let importedGames = 0;
    let importedTournaments = 0;
    const errors = [];

    try {
      await onImport({ grouped, loose,
        onProgress: (g, t) => { importedGames = g; importedTournaments = t; },
        onError: (e) => errors.push(e),
      });
    } catch (err) {
      errors.push(err.message);
    }

    setImportResult({ importedGames, importedTournaments, errors });
    setImporting(false);
    setStep('done');
  };

  const { grouped, loose } = parsed ? groupByTournament(parsed.rows) : { grouped: {}, loose: [] };
  const tournamentCount = Object.keys(grouped).length;
  const tournamentGameCount = Object.values(grouped).reduce((s, r) => s + r.length, 0);

  return (
    <Modal onClose={onClose}>
      <div>
        <h2 className="modal-title">Importar partidas</h2>

        {/* ── STEP: upload ── */}
        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Sube un archivo CSV con tus partidas. Campos obligatorios: <strong style={{ color: 'var(--text-secondary)' }}>Arquetipo propio</strong>, <strong style={{ color: 'var(--text-secondary)' }}>Arquetipo rival</strong> y <strong style={{ color: 'var(--text-secondary)' }}>Score</strong> (2-0, 2-1, 0-2 o 1-2).
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Los CSV exportados desde ManaMetrick conservarán los torneos agrupados. CSVs externos se importan como partidas sueltas.
            </p>

            <div
              style={{
                border: '2px dashed rgba(108,87,255,0.3)',
                borderRadius: 10,
                padding: '32px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: e.dataTransfer.files } }); }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Haz clic o arrastra tu CSV aquí</p>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '6px 0 0' }}>.csv · UTF-8 · separador coma o punto y coma</p>
            </div>

            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />

            {fileError && <div className="auth-error">{fileError}</div>}
          </div>
        )}

        {/* ── STEP: preview ── */}
        {step === 'preview' && parsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Resumen */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div className="stat-chip purple">
                <div className="stat-chip-value">{parsed.rows.length}</div>
                <div className="stat-chip-label">Partidas válidas</div>
              </div>
              {tournamentCount > 0 && (
                <div className="stat-chip blue">
                  <div className="stat-chip-value">{tournamentCount}</div>
                  <div className="stat-chip-label">Torneos ({tournamentGameCount} rondas)</div>
                </div>
              )}
              <div className="stat-chip green">
                <div className="stat-chip-value">{loose.length}</div>
                <div className="stat-chip-label">Partidas sueltas</div>
              </div>
              {parsed.errors.length > 0 && (
                <div className="stat-chip red">
                  <div className="stat-chip-value">{parsed.errors.length}</div>
                  <div className="stat-chip-label">Filas ignoradas</div>
                </div>
              )}
            </div>

            {/* Errores */}
            {parsed.errors.length > 0 && (
              <div style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-red)', margin: '0 0 6px' }}>Filas ignoradas por errores:</p>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {parsed.errors.slice(0, 5).map((e, i) => (
                    <li key={i} style={{ fontSize: 12, color: '#f09090' }}>{e}</li>
                  ))}
                  {parsed.errors.length > 5 && (
                    <li style={{ fontSize: 12, color: 'var(--text-dim)' }}>...y {parsed.errors.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}

            {/* Tabla previa — primeras 8 filas */}
            <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Arquetipo propio', 'Arquetipo rival', 'Score', 'Torneo', 'Fecha'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 8).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '7px 10px', color: 'var(--text-primary)' }}>{row.archetype}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-primary)' }}>{row.opponent_archetype}</td>
                      <td style={{ padding: '7px 10px', color: row.result === 'win' ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>{row.score}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{row.tournament_name || (row._tournament_id_orig ? '(torneo)' : '—')}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-dim)' }}>{new Date(row.created_at).toLocaleDateString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > 8 && (
                <p style={{ fontSize: 11, color: 'var(--text-dim)', padding: '8px 10px', margin: 0 }}>
                  ...y {parsed.rows.length - 8} filas más
                </p>
              )}
            </div>

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => { setStep('upload'); setParsed(null); }}>← Volver</button>
              {parsed.rows.length > 0 && (
                <button className="btn btn-primary" onClick={handleImport}>
                  Confirmar importación ({parsed.rows.length} partidas)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP: importing ── */}
        {step === 'importing' && (
          <div className="loading-state" style={{ padding: '48px 0' }}>
            <div className="spinner" />
            <span>Importando partidas...</span>
          </div>
        )}

        {/* ── STEP: done ── */}
        {step === 'done' && importResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                Importación completada
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {importResult.importedGames} partidas importadas
                {importResult.importedTournaments > 0 && ` · ${importResult.importedTournaments} torneos`}
              </p>
            </div>
            {importResult.errors.length > 0 && (
              <div className="auth-error">
                {importResult.errors.slice(0, 3).map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportGamesModal;