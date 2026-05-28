import React, { useState } from 'react';

const TournamentRound = ({ roundIndex, round, archetypes, onChange }) => {
  const [noteOpen, setNoteOpen] = useState(false);

  const wins    = round.results.filter(r => r === 'win').length;
  const losses  = round.results.filter(r => r === 'loss').length;
  const outcome = wins >= 2 ? 'win' : losses >= 2 ? 'loss' : null;

  const handleResultClick = (index) => {
    if (index === 2) {
      const first = round.results[0];
      const second = round.results[1];
      if (!first || !second || first === second) return;
    }
    const newResults = [...round.results];
    const current = newResults[index];
    newResults[index] = current === null ? 'win' : current === 'win' ? 'loss' : null;
    onChange({ ...round, results: newResults });
  };

  const getCircleStyle = (result, index) => {
    const first  = round.results[0];
    const second = round.results[1];
    const needsDecider = first && second && first !== second;
    const isLocked = index === 2 && !needsDecider;
    const base = {
      width: 32, height: 32, borderRadius: '50%', border: '2px solid',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, transition: 'all 0.15s ease',
      userSelect: 'none', flexShrink: 0,
      cursor: isLocked ? 'not-allowed' : 'pointer',
      opacity: isLocked ? 0.3 : 1,
    };
    if (result === 'win')  return { ...base, background: '#22c55e', borderColor: '#16a34a', color: '#fff' };
    if (result === 'loss') return { ...base, background: '#ef4444', borderColor: '#dc2626', color: '#fff' };
    return { ...base, background: 'transparent', borderColor: isLocked ? '#333' : '#555', color: '#888' };
  };

  const getLabel = (r) => r === 'win' ? 'W' : r === 'loss' ? 'L' : '·';

  const hasNote = round.note && round.note.trim().length > 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '10px 14px', borderRadius: 8,
      background: outcome ? (outcome === 'win' ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)') : 'rgba(255,255,255,0.03)',
      border: outcome ? `1px solid ${outcome === 'win' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` : '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.15s',
    }}>

      {/* Fila principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#888', fontSize: 13, minWidth: 60, flexShrink: 0 }}>
          Ronda {roundIndex + 1}
        </span>

        <select
          value={round.opponentArchetype || ''}
          onChange={e => onChange({ ...round, opponentArchetype: e.target.value })}
          style={{ flex: 1, background: '#1a1a1a', color: '#e0e0e0', border: '1px solid #333', borderRadius: 6, padding: '6px 10px', fontSize: 13, cursor: 'pointer', minWidth: 0 }}
        >
          <option value="">Arquetipo rival...</option>
          {archetypes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={getCircleStyle(round.results[i] || null, i)}
              onClick={() => handleResultClick(i)}
              title={i === 2 && !(round.results[0] && round.results[1] && round.results[0] !== round.results[1]) ? 'Se activa con empate 1-1' : ''}
            >
              {getLabel(round.results[i] || null)}
            </div>
          ))}
        </div>

        {outcome && (
          <span style={{ fontSize: 13, fontWeight: 700, flexShrink: 0, color: outcome === 'win' ? '#22c55e' : '#ef4444' }}>
            {outcome === 'win' ? '✓' : '✗'}
          </span>
        )}
      </div>

      {/* Nombre del oponente */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 68 }}>
        <input
          type="text"
          placeholder="Nombre del oponente (opcional)"
          value={round.opponentName || ''}
          onChange={e => onChange({ ...round, opponentName: e.target.value })}
          maxLength={80}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', color: '#aaa',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5,
            padding: '5px 10px', fontSize: 12, outline: 'none',
          }}
        />

        {/* Botón nota */}
        <button
          type="button"
          onClick={() => setNoteOpen(o => !o)}
          title={noteOpen ? 'Ocultar nota' : 'Añadir nota'}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: noteOpen || hasNote ? 'rgba(108,87,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${noteOpen || hasNote ? 'rgba(108,87,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 5, padding: '5px 9px',
            color: noteOpen || hasNote ? '#a89fff' : '#555',
            fontSize: 12, cursor: 'pointer', flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          📝 <span style={{ fontSize: 11 }}>{noteOpen ? 'Ocultar' : 'Nota'}</span>
        </button>
      </div>

      {/* Campo de nota desplegable */}
      {noteOpen && (
        <div style={{ paddingLeft: 68 }}>
          <textarea
            placeholder="Notas de la partida (líneas de juego, lecturas, sideboard...)"
            value={round.note || ''}
            onChange={e => onChange({ ...round, note: e.target.value })}
            maxLength={500}
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              color: '#c8bfaf',
              border: '1px solid rgba(108,87,255,0.2)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 12, lineHeight: 1.5,
              outline: 'none', resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          {round.note && (
            <div style={{ fontSize: 11, color: '#3a3a60', textAlign: 'right', marginTop: 2 }}>
              {round.note.length}/500
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentRound;