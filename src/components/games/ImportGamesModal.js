import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../shared/Modal';

// ── Helpers ──────────────────────────────────────────────────────────────────

const scoreToResult = (score) => {
  if (!score) return null;
  const s = score.trim();
  if (s === '2-0' || s === '2-1') return 'win';
  if (s === '0-2' || s === '1-2') return 'loss';
  if (s === '1-1') return 'draw';
  return null;
};

const CSV_HEADERS = ['Fecha', 'Mazo', 'Arquetipo propio', 'Arquetipo rival', 'Nombre oponente', 'Score', 'Torneo', 'Nota'];

const EXAMPLE_ROWS = [
  ['02/06/2026', 'WW Heroic', 'Heroic', 'Burn',            'Carlos',   '2-0', 'FNM Junio', ''],
  ['02/06/2026', 'WW Heroic', 'Heroic', 'Elves',           'Marta',    '2-1', 'FNM Junio', 'Partida ajustada'],
  ['02/06/2026', 'WW Heroic', 'Heroic', 'Gruul Cascade',   '',         '1-2', 'FNM Junio', ''],
  ['02/06/2026', 'Burn',      'Burn',   'Heroic',          'Juan',     '0-2', '',           ''],
  ['01/06/2026', 'Burn',      'Burn',   'Dimir Control',   '',         '2-1', '',           'Buen sideboard'],
  ['01/06/2026', 'WW Heroic', 'Heroic', 'Azorius Familiars','',        '1-1', 'Liga mayo',  'Empate sin desempate'],
];

const downloadCSV = (rows, filename) => {
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [CSV_HEADERS, ...rows].map(r => r.map(escape).join(','));
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const parseCSV = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ['El archivo está vacío o no tiene datos.'] };

  const sep = lines[0].includes(';') ? ';' : ',';

  const parseRow = (line) => {
    const cols = []; let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (c === sep && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-záéíóúñ_\s]/gi, '').trim());

  const idx = (names) => {
    for (const n of names) {
      const i = headers.findIndex(h => h.includes(n));
      if (i !== -1) return i;
    }
    return -1;
  };

  const colFecha     = idx(['fecha']);
  const colMazo      = idx(['mazo']);
  const colArqPropio = idx(['propio', 'arquetipo propio']);
  const colArqRival  = idx(['rival', 'arquetipo rival']);
  const colOponente  = idx(['oponente']);
  const colScore     = idx(['score']);
  const colTorneo    = idx(['torneo']);
  const colNota      = idx(['nota']);
  // Soporta tanto el formato antiguo (_tournament_id) como el nuevo (Torneo)
  const colTournamentId = idx(['_tournament_id', 'tournament_id']);

  const rows = []; const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    const get = (ci) => (ci !== -1 && cols[ci] ? cols[ci].trim() : '');

    const arquetipo    = get(colArqPropio);
    const oppArchetype = get(colArqRival);
    const score        = get(colScore);
    const result       = scoreToResult(score);

    const rowErrors = [];
    if (!arquetipo)    rowErrors.push('falta arquetipo propio');
    if (!oppArchetype) rowErrors.push('falta arquetipo rival');
    if (!result)       rowErrors.push(`score inválido: "${score}" (usa 2-0, 2-1, 0-2, 1-2 o 1-1)`);

    if (rowErrors.length > 0) { errors.push(`Fila ${i + 1}: ${rowErrors.join(', ')}`); continue; }

    let createdAt = new Date().toISOString();
    const fechaStr = get(colFecha);
    if (fechaStr) {
      const parts = fechaStr.includes('/') ? fechaStr.split('/').reverse().join('-') : fechaStr;
      const d = new Date(parts);
      if (!isNaN(d)) createdAt = d.toISOString();
    }

    // Agrupación por torneo: primero por _tournament_id (exportaciones antiguas), luego por nombre de torneo
    const tournamentIdOrig = get(colTournamentId);
    const tournamentName   = get(colTorneo);

    rows.push({
      _rowNum: i + 1,
      created_at:          createdAt,
      deck_name:           get(colMazo) || '',
      archetype:           arquetipo,
      opponent_archetype:  oppArchetype,
      opponent_name:       get(colOponente) || '',
      score,
      result,
      tournament_name:     tournamentName,
      note:                get(colNota) || '',
      _tournament_id_orig: tournamentIdOrig || '',
      _tournament_name_key: tournamentIdOrig || tournamentName || '', // clave de agrupación
    });
  }

  return { rows, errors };
};

// Agrupa por _tournament_id si existe, si no por nombre de torneo
const groupByTournament = (rows) => {
  const grouped = {};
  const loose   = [];

  rows.forEach(row => {
    const key = row._tournament_name_key;
    if (key) {
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    } else {
      loose.push(row);
    }
  });

  return { grouped, loose };
};

// ── Componente ────────────────────────────────────────────────────────────────

const ImportGamesModal = ({ onClose, onImport, decks = [], archetypes = [] }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload');
  const [parsed, setParsed] = useState(null);
  const [fileError, setFileError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const [showArchetypes, setShowArchetypes] = useState(false);
  const fileRef = useRef();

  // Mazos del usuario indexados por nombre (lowercase)
  const deckByName = {};
  (decks || []).forEach(d => { deckByName[d.name.trim().toLowerCase()] = d; });

  // Nombres de mazos del CSV que no están en la colección del usuario
  const missingDecks = parsed
    ? [...new Set(
        parsed.rows
          .map(r => r.deck_name.trim())
          .filter(name => name && !deckByName[name.toLowerCase()])
      )]
    : [];

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseCSV(ev.target.result);
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
    setStep('importing');

    const { grouped, loose } = groupByTournament(parsed.rows);
    let importedGames = 0, importedTournaments = 0;
    const errors = [];

    try {
      await onImport({
        grouped, loose,
        onProgress: (g, t) => { importedGames = g; importedTournaments = t; },
        onError: (e) => errors.push(e),
      });
    } catch (err) { errors.push(err.message); }

    setImportResult({ importedGames, importedTournaments, errors });
    setStep('done');
  };

  const { grouped, loose } = parsed ? groupByTournament(parsed.rows) : { grouped: {}, loose: [] };
  const tournamentCount = Object.keys(grouped).length;
  const tournamentGameCount = Object.values(grouped).reduce((s, r) => s + r.length, 0);

  return (
    <>
    <Modal onClose={onClose}>
      <div style={{ minWidth: 320, maxWidth: 560, width: '100%' }}>
        <h2 className="modal-title">Importar partidas</h2>

        {/* ── STEP: upload ── */}
        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Sube un archivo CSV con tus partidas. Campos obligatorios:{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>Arquetipo propio</strong>,{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>Arquetipo rival</strong> y{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>Score</strong>{' '}
              (2-0, 2-1, 0-2, 1-2 o 1-1). Las partidas con el mismo nombre de torneo se agrupan automáticamente.
            </p>

            {/* Botones ejemplo / base */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => setShowExample(v => !v)}
              >
                {showExample ? '▲ Ocultar ejemplo' : '📋 Ver CSV de ejemplo'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => setShowArchetypes(true)}
              >
                🏷 Ver arquetipos
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => downloadCSV([[]], `plantilla_partidas.csv`)}
              >
                ⬇ Descargar plantilla vacía
              </button>
            </div>

            {/* Tabla de ejemplo */}
            {showExample && (
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'rgba(108,87,255,0.12)' }}>
                      {CSV_HEADERS.map(h => (
                        <th key={h} style={{ padding: '7px 8px', color: '#a78bfa', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {EXAMPLE_ROWS.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: '6px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{cell || <span style={{ color: '#333' }}>—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11 }}
                    onClick={() => downloadCSV(EXAMPLE_ROWS, 'ejemplo_partidas.csv')}
                  >
                    ⬇ Descargar este ejemplo
                  </button>
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              style={{ border: '2px dashed rgba(108,87,255,0.3)', borderRadius: 10, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile({ target: { files: e.dataTransfer.files } }); }}
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

            {/* Resumen chips */}
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

            {/* Aviso mazos no encontrados */}
            {missingDecks.length > 0 && (
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '12px 14px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', margin: '0 0 6px' }}>
                  ⚠️ Algunos mazos del CSV no están en tu colección
                </p>
                <p style={{ fontSize: 12, color: 'rgba(251,191,36,0.8)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Las siguientes partidas se importarán correctamente, pero sin enlace a un mazo de tu colección.
                  Si quieres asociarlas, añade los mazos primero:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {missingDecks.map(name => (
                    <span key={name} style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontWeight: 600 }}>
                      {name}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12, borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}
                    onClick={() => { onClose(); navigate('/my-decks'); }}
                  >
                    🃏 Ir a crear mazos
                  </button>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>o</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', alignSelf: 'center' }}>importar igualmente sin enlace</span>
                </div>
              </div>
            )}

            {/* Errores de parsing */}
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

            {/* Tabla preview */}
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
                      <td style={{ padding: '7px 10px', color: row.result === 'win' ? 'var(--accent-green)' : row.result === 'draw' ? '#3b82f6' : 'var(--accent-red)', fontWeight: 700 }}>{row.score}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{row.tournament_name || '—'}</td>
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
                  Importar igualmente ({parsed.rows.length} partidas)
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

      {/* ── Modal arquetipos disponibles ── */}
      {showArchetypes && (
        <Modal onClose={() => setShowArchetypes(false)}>
          <div style={{ minWidth: 300, maxWidth: 480, width: '100%' }}>
            <h2 className="modal-title">Arquetipos disponibles</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              Usa exactamente estos nombres en la columna <strong style={{ color: 'var(--text-secondary)' }}>Arquetipo propio</strong> y <strong style={{ color: 'var(--text-secondary)' }}>Arquetipo rival</strong> de tu CSV.
            </p>
            {archetypes.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                No hay arquetipos registrados todavía.
              </p>
            ) : (
              <div style={{ maxHeight: 340, overflowY: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {Array.from({ length: Math.ceil(archetypes.length / 3) }, (_, row) => (
                      <tr key={row} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {[0, 1, 2].map(col => {
                          const name = archetypes[row * 3 + col];
                          return (
                            <td key={col} style={{
                              padding: '8px 12px',
                              color: name ? '#c4b5fd' : 'transparent',
                              width: '33.3%',
                              borderRight: col < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              fontWeight: 500,
                            }}>
                              {name || ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setShowArchetypes(false)}>Cerrar</button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
    </>
  );
};

export default ImportGamesModal;