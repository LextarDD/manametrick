import React, { useState } from 'react';
import Modal from '../shared/Modal';
import TournamentRound from './TournamentRound';

const TournamentForm = ({ decks, archetypes, onSave, onClose, initialData }) => {
  const isEditing = !!initialData;
  const bestOf = 3;

  const buildRoundsFromGames = (games) => {
    if (!games || games.length === 0) return buildEmptyRounds(4);
    const roundMap = new Map();
    games.forEach(g => {
      if (!roundMap.has(g.opponent_archetype)) {
        roundMap.set(g.opponent_archetype, {
          results: [],
          opponentName: g.opponent_name || '',
          note: g.note || '',
        });
      }
      roundMap.get(g.opponent_archetype).results.push(g.result);
    });
    return Array.from(roundMap.entries()).map(([arch, data]) => ({
      opponentArchetype: arch,
      opponentName: data.opponentName,
      note: data.note,
      results: Array.from({ length: bestOf }, (_, i) => data.results[i] || null),
    }));
  };

  function buildEmptyRounds(n) {
    return Array.from({ length: n }, () => ({
      opponentArchetype: '',
      results: Array.from({ length: bestOf }, () => null),
    }));
  }

  const [selectedDeckId, setSelectedDeckId] = useState(
    isEditing ? initialData.tournament.deck_id : ''
  );
  const [tournamentName, setTournamentName] = useState(
    isEditing ? initialData.tournament.name || '' : ''
  );
  const [tournamentType, setTournamentType] = useState(
    isEditing ? (initialData.tournament.type || 'physical') : 'physical'
  );
  const [rounds, setRounds] = useState(() =>
    isEditing ? buildRoundsFromGames(initialData.games) : buildEmptyRounds(4)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addRound = () => {
    setRounds(prev => [
      ...prev,
      { opponentArchetype: '', results: Array.from({ length: bestOf }, () => null) },
    ]);
  };

  const removeLastRound = () => {
    setRounds(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const handleRoundChange = (index, updated) => {
    setRounds(prev => prev.map((r, i) => (i === index ? updated : r)));
  };

  // Misma lógica que en useTournaments._getRoundOutcome
  const getRoundOutcome = (results) => {
    const wins   = results.filter(r => r === 'win').length;
    const losses = results.filter(r => r === 'loss').length;
    if (wins >= 2)   return 'win';
    if (losses >= 2) return 'loss';
    if (results.some(r => r === 'draw')) return 'draw';
    if (wins === 1 && losses === 1) return 'draw'; // W+L sin desempate = empate
    return null;
  };

  // Una ronda es "empate" si tiene W+L sin resolver O tiene círculo 'draw' explícito
  const roundIsDrawn = (r) => {
    const results = r.results || [];
    const wins   = results.filter(x => x === 'win').length;
    const losses = results.filter(x => x === 'loss').length;
    return results.some(x => x === 'draw') || (wins === 1 && losses === 1);
  };

  const handleSave = async () => {
    if (!selectedDeckId) { setError('Selecciona un mazo.'); return; }

    // Validación online: no se permiten empates (ni W+L sin desempate, ni círculo =)
    if (tournamentType === 'online') {
      const hasDrawRound = rounds.some(r => roundIsDrawn(r));
      if (hasDrawRound) {
        setError('En los torneos Online no puede haber empates, marque un ganador.');
        return;
      }
    }

    setError('');
    setSaving(true);
    try {
      const deck = decks.find(d => d.id === selectedDeckId);
      await onSave({
        deckId: deck.id,
        deckName: deck.name,
        deckArchetype: deck.archetype || null,
        name: tournamentName,
        type: tournamentType,
        rounds,
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Error al guardar el torneo.');
    } finally {
      setSaving(false);
    }
  };

  const score = rounds.reduce(
    (acc, r) => {
      const outcome = getRoundOutcome(r.results);
      if (outcome === 'win')  acc.wins++;
      if (outcome === 'loss') acc.losses++;
      if (outcome === 'draw') acc.draws++;
      return acc;
    },
    { wins: 0, losses: 0, draws: 0 }
  );

  const allowDraw = tournamentType === 'physical';

  return (
    <Modal onClose={onClose}>
      <div style={{
        background: '#111', borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 560, maxHeight: '90vh',
        overflowY: 'auto', boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#f0f0f0', fontSize: 20, fontWeight: 700 }}>
            {isEditing ? 'Editar torneo' : 'Registrar torneo'}
          </h2>
          {score.wins + score.losses + score.draws > 0 && (
            <p style={{ margin: '6px 0 0', color: '#888', fontSize: 14 }}>
              Resultado actual:{' '}
              <span style={{ color: '#22c55e', fontWeight: 600 }}>{score.wins}W</span>
              {' – '}
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{score.losses}L</span>
              {score.draws > 0 && (
                <>
                  {' – '}
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>{score.draws}D</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Tournament name */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Nombre del torneo (opcional)</label>
          <input
            type="text"
            placeholder="Ej: Liga de mayo, FNM..."
            value={tournamentName}
            onChange={e => setTournamentName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Deck selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Mazo *</label>
          <select value={selectedDeckId} onChange={e => setSelectedDeckId(e.target.value)} style={inputStyle}>
            <option value="">Selecciona un mazo...</option>
            {decks.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}{d.archetype ? ` (${d.archetype})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tournament type */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Tipo de torneo</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'physical', label: '⚔️ Torneo Físico' },
              { value: 'online',   label: '🖥️ Torneo Online' },
            ].map(opt => {
              const active = tournamentType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTournamentType(opt.value); setError(''); }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#a5b4fc' : '#666',
                    border: active ? '1.5px solid rgba(99,102,241,0.55)' : '1.5px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {allowDraw ? (
            <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0' }}>
              Físico: los empates están permitidos (W+L sin desempate, o marca = tras 1-1).
            </p>
          ) : (
            <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0' }}>
              Online: todas las rondas deben tener un ganador.
            </p>
          )}
        </div>

        {/* Rounds header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...labelStyle, margin: 0 }}>
            Rondas{' '}
            <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              ({rounds.length})
            </span>
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={removeLastRound} disabled={rounds.length <= 1} style={roundBtnStyle}>
              − Quitar
            </button>
            <button onClick={addRound} style={{ ...roundBtnStyle, borderColor: '#6366f1', color: '#818cf8' }}>
              + Añadir
            </button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#555', margin: '0 0 10px' }}>
          W = Victoria · L = Derrota{allowDraw ? ' · = Empate' : ''} · Las rondas sin completar no se guardan como partida.
        </p>

        {/* Rounds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {rounds.map((round, i) => (
            <TournamentRound
              key={i}
              roundIndex={i}
              round={round}
              archetypes={archetypes}
              onChange={updated => handleRoundChange(i, updated)}
              bestOf={bestOf}
              allowDraw={allowDraw}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar torneo'}
          </button>
        </div>

        {/* Error debajo del botón guardar */}
        {error && (
          <p style={{
            color: '#f87171', fontSize: 13, marginTop: 12,
            padding: '8px 12px', background: 'rgba(239,68,68,0.1)',
            borderRadius: 6, textAlign: 'center',
          }}>
            ⚠️ {error}
          </p>
        )}
      </div>
    </Modal>
  );
};

const labelStyle = { display: 'block', color: '#aaa', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };
const inputStyle = { width: '100%', background: '#1a1a1a', color: '#e0e0e0', border: '1px solid #333', borderRadius: 6, padding: '8px 12px', fontSize: 14, boxSizing: 'border-box' };
const cancelBtnStyle = { padding: '9px 18px', borderRadius: 7, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 14 };
const saveBtnStyle = { padding: '9px 22px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const roundBtnStyle = { padding: '4px 10px', borderRadius: 6, border: '1px solid #333', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: 12 };

export default TournamentForm;