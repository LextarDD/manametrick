import React, { useState, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import useGames from '../hooks/useGames';
import useDecks from '../hooks/useDecks';
import useArchetypes from '../hooks/useArchetypes';
import GameHistory from '../components/games/GameHistory';
import GameFilters from '../components/games/GameFilters';
import AddGameModal from '../components/games/AddGameModal';

const GameHistoryPage = () => {
  const { user } = useAuth();
  const { games, loading, error, addGame, deleteGame } = useGames(user?.id);
  const { decks } = useDecks(user?.id);
  const { archetypes } = useArchetypes();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', deckId: '' });
  const [saveError, setSaveError] = useState('');

  const archetypeNames = archetypes.map(a => (typeof a === 'string' ? a : a.name));

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      if (filters.deckId && g.deck_id !== filters.deckId) return false;
      if (filters.dateFrom && new Date(g.created_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(g.created_at) > to) return false;
      }
      return true;
    });
  }, [games, filters]);

  const stats = useMemo(() => {
    const roundWins   = filteredGames.filter(g => g.result === 'win').length;
    const roundLosses = filteredGames.filter(g => g.result === 'loss').length;
    const total = roundWins + roundLosses;
    const roundWR = total > 0 ? Math.round(roundWins / total * 100) : null;

    let gW = 0, gL = 0;
    filteredGames.forEach(g => {
      if      (g.score === '2-0') { gW += 2; }
      else if (g.score === '2-1') { gW += 2; gL += 1; }
      else if (g.score === '0-2') { gL += 2; }
      else if (g.score === '1-2') { gW += 1; gL += 2; }
      else { g.result === 'win' ? (gW += 2) : (gL += 2); }
    });
    const totalG = gW + gL;
    const gameWR = totalG > 0 ? Math.round(gW / totalG * 100) : null;

    return { roundWins, roundLosses, total, roundWR, gW, gL, gameWR };
  }, [filteredGames]);

  const handleSave = async (gameData) => {
    setSaveError('');
    try { await addGame(gameData); }
    catch (err) { setSaveError(err.message); throw err; }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Historial de <span className="gradient-text">Partidas</span></h1>
          <p className="page-subtitle">Todas tus partidas registradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Añadir partida
        </button>
      </div>

      {/* Stats summary */}
      {stats.total > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {/* Rondas */}
          <div className="card" style={{ flex: 1, minWidth: 240 }}>
            <div className="card-body" style={{ padding: '14px 18px' }}>
              <div className="card-title" style={{ marginBottom: 12 }}>
                <div className="card-title-icon purple">🎯</div>
                <span className="card-title-text" style={{ fontSize: 12 }}>Rondas</span>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatNum value={stats.total}      label="Jugadas"  color="var(--text-primary)" />
                <Divider />
                <StatNum value={stats.roundWins}  label="Ganadas"  color="var(--accent-green)" />
                <Divider />
                <StatNum value={stats.roundLosses}label="Perdidas" color="var(--accent-red)" />
                {stats.roundWR !== null && (
                  <>
                    <Divider />
                    <StatNum value={`${stats.roundWR}%`} label="Winrate" color={stats.roundWR >= 50 ? 'var(--accent-green)' : 'var(--accent-red)'} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Partidas individuales */}
          <div className="card" style={{ flex: 1, minWidth: 240 }}>
            <div className="card-body" style={{ padding: '14px 18px' }}>
              <div className="card-title" style={{ marginBottom: 12 }}>
                <div className="card-title-icon blue">⚔</div>
                <span className="card-title-text" style={{ fontSize: 12 }}>Partidas individuales</span>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatNum value={stats.gW} label="Ganadas"  color="var(--accent-green)" />
                <Divider />
                <StatNum value={stats.gL} label="Perdidas" color="var(--accent-red)" />
                {stats.gameWR !== null && (
                  <>
                    <Divider />
                    <StatNum value={`${stats.gameWR}%`} label="Winrate" color={stats.gameWR >= 50 ? 'var(--accent-green)' : 'var(--accent-red)'} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {games.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-body" style={{ padding: '12px 18px' }}>
            <GameFilters decks={decks} onFilterChange={setFilters} />
          </div>
        </div>
      )}

      {saveError && (
        <div className="auth-error" style={{ marginBottom: 12 }}>{saveError}</div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Cargando partidas...</span>
        </div>
      ) : error ? (
        <div className="auth-error">Error: {error}</div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="card-title">
              <div className="card-title-icon purple">📋</div>
              <span className="card-title-text">
                {filteredGames.length} partida{filteredGames.length !== 1 ? 's' : ''}
                {filteredGames.length !== games.length && ` (filtradas de ${games.length})`}
              </span>
            </div>
            <GameHistory
              games={filteredGames}
              decks={decks}
              onDelete={deleteGame}
            />
          </div>
        </div>
      )}

      {showAddModal && (
        <AddGameModal
          decks={decks}
          archetypes={archetypeNames}
          onSave={handleSave}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

const StatNum = ({ value, label, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 56 }}>
    <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-.03em' }}>{value}</span>
    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)' }}>{label}</span>
  </div>
);

const Divider = () => (
  <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,.06)', flexShrink: 0 }} />
);

export default GameHistoryPage;
