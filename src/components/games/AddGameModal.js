import React, { useState } from 'react';
import Modal from '../shared/Modal';

const AddGameModal = ({ decks, archetypes, onSave, onClose }) => {
  const [deckId, setDeckId] = useState('');
  const [opponentArchetype, setOpponentArchetype] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [result, setResult] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showDeckDropdown, setShowDeckDropdown] = useState(false);
  const [hoveredDeck, setHoveredDeck] = useState(null);

  const selectedDeck = decks.find(d => d.id === deckId);
  const isValid = deckId && opponentArchetype && result;

  const RESULT_OPTIONS = [
    { value: 'win',    label: '2-0', sub: 'Victoria', score: '2-0', dbResult: 'win'  },
    { value: 'win21',  label: '2-1', sub: 'Victoria', score: '2-1', dbResult: 'win'  },
    { value: 'draw11', label: '1-1', sub: 'Empate',   score: '1-1', dbResult: 'draw' },
    { value: 'loss02', label: '0-2', sub: 'Derrota',  score: '0-2', dbResult: 'loss' },
    { value: 'loss12', label: '1-2', sub: 'Derrota',  score: '1-2', dbResult: 'loss' },
  ];

  const handleSubmit = async () => {
    if (!isValid) { setError('Completa todos los campos obligatorios.'); return; }
    setSaving(true);
    setError('');
    try {
      const opt = RESULT_OPTIONS.find(o => o.value === result);
      await onSave({
        deck_id:            deckId,
        deck_name:          selectedDeck?.name || '',
        archetype:          selectedDeck?.archetype || '',
        opponent_archetype: opponentArchetype,
        opponent_name:      opponentName.trim() || '',
        result:             opt.dbResult,
        score:              opt.score,
        note:               note.trim(),
        tournament_id:      null,
      });
      onClose();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Registrar partida</h2>
          <p style={styles.subtitle}>Añade una partida suelta a tu historial</p>
        </div>

        <div style={styles.form}>
          {/* Mazo */}
          <div style={styles.field}>
            <label style={styles.label}>Tu mazo <span style={styles.required}>*</span></label>
            <div style={{ position: 'relative' }}>
              <div style={styles.select} onClick={() => setShowDeckDropdown(!showDeckDropdown)}>
                {deckId ? decks.find(d => d.id === deckId)?.name : '— Selecciona un mazo —'}
              </div>
              {showDeckDropdown && (
                <div style={styles.dropdown}>
                  {decks.map(d => (
                    <div key={d.id}
                      style={{ ...styles.dropdownItem, background: hoveredDeck === d.id ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                      onClick={() => { setDeckId(d.id); setShowDeckDropdown(false); }}
                      onMouseEnter={() => setHoveredDeck(d.id)}
                      onMouseLeave={() => setHoveredDeck(null)}
                    >
                      {d.name}{d.archetype ? ` (${d.archetype})` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedDeck?.archetype && <div style={styles.hint}>Arquetipo: {selectedDeck.archetype}</div>}
          </div>

          {/* Arquetipo rival */}
          <div style={styles.field}>
            <label style={styles.label}>Arquetipo rival <span style={styles.required}>*</span></label>
            <div style={{ position: 'relative' }}>
              <div style={styles.select} onClick={() => setShowDropdown(!showDropdown)}>
                {opponentArchetype || '— Selecciona —'}
              </div>
              {showDropdown && (
                <div style={styles.dropdown}>
                  {archetypes.map(a => (
                    <div key={a}
                      style={{ ...styles.dropdownItem, background: hoveredItem === a ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                      onClick={() => { setOpponentArchetype(a); setShowDropdown(false); }}
                      onMouseEnter={() => setHoveredItem(a)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="O escribe nombre libre..."
              value={archetypes.includes(opponentArchetype) ? '' : opponentArchetype}
              onChange={e => setOpponentArchetype(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Nombre del oponente */}
          <div style={styles.field}>
            <label style={styles.label}>
              Nombre del oponente <span style={styles.optional}>(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Carlos, JuanMTG..."
              value={opponentName}
              onChange={e => setOpponentName(e.target.value)}
              style={styles.input}
              maxLength={80}
            />
          </div>

          {/* Resultado */}
          <div style={styles.field}>
            <label style={styles.label}>Resultado <span style={styles.required}>*</span></label>
            <div style={styles.resultRow}>
              {RESULT_OPTIONS.map(({ value, label, sub, dbResult }) => {
                const isWin  = dbResult === 'win';
                const isDraw = dbResult === 'draw';
                const isActive = result === value;

                const inactiveStyle = isWin  ? styles.resultWin
                                    : isDraw ? styles.resultDraw
                                    : styles.resultLoss;
                const activeStyle   = isWin  ? styles.resultWinActive
                                    : isDraw ? styles.resultDrawActive
                                    : styles.resultLossActive;

                return (
                  <button
                    key={value}
                    style={{ ...styles.resultBtn, ...(isActive ? activeStyle : inactiveStyle) }}
                    onClick={() => setResult(value)}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{label}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nota */}
          <div style={styles.field}>
            <label style={styles.label}>Nota <span style={styles.optional}>(opcional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="¿Algo destacable de la partida?" style={styles.textarea} rows={3} maxLength={500} />
            <div style={styles.charCount}>{note.length}/500</div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button style={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancelar</button>
            <button
              style={{ ...styles.saveBtn, opacity: !isValid || saving ? 0.5 : 1, cursor: !isValid || saving ? 'not-allowed' : 'pointer' }}
              onClick={handleSubmit}
              disabled={!isValid || saving}
            >
              {saving ? 'Guardando...' : 'Guardar partida'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const styles = {
  container: { width: '100%', maxWidth: 480, margin: '0 auto' },
  header: { marginBottom: 28 },
  title: { margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#e8e0d0', letterSpacing: '-0.02em' },
  subtitle: { margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' },
  required: { color: '#f87171', marginLeft: 2 },
  optional: { color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: -2 },
  select: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#e8e0d0', fontSize: 14, cursor: 'pointer', width: '100%' },
  input: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#e8e0d0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
  resultRow: { display: 'flex', gap: 8 },
  resultBtn: { flex: 1, padding: '10px 6px', borderRadius: 8, border: '2px solid transparent', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  resultWin:        { background: 'rgba(74,222,128,0.06)',   border: '2px solid rgba(74,222,128,0.2)',   color: 'rgba(74,222,128,0.5)'  },
  resultWinActive:  { background: 'rgba(74,222,128,0.15)',   border: '2px solid #4ade80',                color: '#4ade80'               },
  resultDraw:       { background: 'rgba(59,130,246,0.06)',   border: '2px solid rgba(59,130,246,0.2)',   color: 'rgba(59,130,246,0.5)'  },
  resultDrawActive: { background: 'rgba(59,130,246,0.15)',   border: '2px solid #3b82f6',                color: '#3b82f6'               },
  resultLoss:       { background: 'rgba(248,113,113,0.06)',  border: '2px solid rgba(248,113,113,0.2)',  color: 'rgba(248,113,113,0.5)' },
  resultLossActive: { background: 'rgba(248,113,113,0.15)',  border: '2px solid #f87171',                color: '#f87171'               },
  textarea: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#e8e0d0', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' },
  charCount: { fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: -4 },
  error: { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#f87171' },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  saveBtn: { background: 'rgba(139,92,246,0.85)', border: '1px solid rgba(139,92,246,0.6)', borderRadius: 8, padding: '10px 24px', color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e1b2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', zIndex: 100, marginTop: 4 },
  dropdownItem: { padding: '10px 14px', color: '#e8e0d0', fontSize: 14, cursor: 'pointer' },
};

export default AddGameModal;