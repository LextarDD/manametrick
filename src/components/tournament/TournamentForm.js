import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import TournamentRound from './TournamentRound';

/**
 * TournamentForm
 * Modo creación: sin initialData
 * Modo edición:  initialData = { tournament, games }
 *   tournament: objeto de la tabla tournaments
 *   games: partidas de ese torneo (para reconstruir los rounds)
 */
const TournamentForm = ({ decks, archetypes, onSave, onClose, initialData }) => {
  const isEditing = !!initialData;

  // Reconstruir rounds desde las partidas del torneo si estamos editando
  const buildRoundsFromGames = (games, bo) => {
    if (!games || games.length === 0) return buildEmptyRounds(4, bo);
    // Agrupar partidas por opponent_archetype en orden de aparición
    const roundMap = new Map();
    games.forEach(g => {
      if (!roundMap.has(g.opponent_archetype)) roundMap.set(g.opponent_archetype, []);
      roundMap.get(g.opponent_archetype).push(g.result);
    });
    return Array.from(roundMap.entries()).map(([arch, results]) => ({
      opponentArchetype: arch,
      results: Array.from({ length: bo }, (_, i) => results[i] || null),
    }));
  };

  function buildEmptyRounds(n, bo) {
    return Array.from({ length: n }, () => ({
      opponentArchetype: '',
      results: Array.from({ length: bo }, () => null),
    }));
  }

  const initialBo = 2;
  const [selectedDeckId, setSelectedDeckId] = useState(
    isEditing ? initialData.tournament.deck_id : ''
  );
  const [tournamentName, setTournamentName] = useState(
    isEditing ? initialData.tournament.name || '' : ''
  );
  const [bestOf, setBestOf] = useState(initialBo);
  const [rounds, setRounds] = useState(() =>
    isEditing
      ? buildRoundsFromGames(initialData.games, initialBo)
      : buildEmptyRounds(4, initialBo)
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

  const handleBestOfChange = (bo) => {
    setBestOf(bo);
    setRounds(prev =>
      prev.map(r => ({
        ...r,
        results: Array.from({ length: bo }, (_, i) => r.results[i] || null),
      }))
    );
  };

  const handleRoundChange = (index, updated) => {
    setRounds(prev => prev.map((r, i) => (i === index ? updated : r)));
  };

  const getRoundOutcome = (results) => {
    const wins   = results.filter(r => r === 'win').length;
    const losses = results.filter(r => r === 'loss').length;
    if (wins >= 2)   return 'win';
    if (losses >= 2) return 'loss';
    return null;
  };

  const handleSave = async () => {
    if (!selectedDeckId) { setError('Selecciona un mazo.'); return; }
    setError('');
    setSaving(true);
    try {
      const deck = decks.find(d => d.id === selectedDeckId);
      await onSave({
        deckId: deck.id,
        deckName: deck.name,
        deckArchetype: deck.archetype || null,
        name: tournamentName,
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
      return acc;
    },
    { wins: 0, losses: 0 }
  );

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
          {score.wins + score.losses > 0 && (
            <p style={{ margin: '6px 0 0', color: '#888', fontSize: 14 }}>
              Resultado actual:{' '}
              <span style={{ color: '#22c55e', fontWeight: 600 }}>{score.wins}W</span>
              {' – '}
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{score.losses}L</span>
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

        {/* Formato */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Formato</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {[2, 3].map(bo => (
              <button
                key={bo}
                onClick={() => handleBestOfChange(bo)}
                style={{
                  padding: '8px 20px', borderRadius: 6, border: '1px solid',
                  borderColor: bestOf === bo ? '#6366f1' : '#333',
                  background: bestOf === bo ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: bestOf === bo ? '#818cf8' : '#888',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                }}
              >
                Bo{bo}
              </button>
            ))}
          </div>
        </div>

        {/* Rounds header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...labelStyle, margin: 0 }}>
            Rondas <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({rounds.length})</span>
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
          W = Victoria · L = Derrota · Las rondas sin completar no se guardan como partida.
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
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 14, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar torneo'}
          </button>
        </div>
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