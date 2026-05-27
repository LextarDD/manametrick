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

  const archetypeNames = archetypes.map((a) => (typeof a === 'string' ? a : a.name));

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (filters.deckId && g.deck_id !== filters.deckId) return false;
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (new Date(g.created_at) < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(g.created_at) > to) return false;
      }
      return true;
    });
  }, [games, filters]);

  // Stats: rondas = matches (win/loss), partidas = juegos individuales calculados desde score
  const stats = useMemo(() => {
    const roundWins = filteredGames.filter((g) => g.result === 'win').length;
    const roundLosses = filteredGames.filter((g) => g.result === 'loss').length;
    const totalRounds = roundWins + roundLosses;
    const roundWinrate = totalRounds > 0 ? Math.round((roundWins / totalRounds) * 100) : null;

    // Partidas individuales desde score (2-0, 2-1, 0-2, 1-2)
    let gameWins = 0;
    let gameLosses = 0;
    filteredGames.forEach((g) => {
      if (g.score === '2-0') { gameWins += 2; gameLosses += 0; }
      else if (g.score === '2-1') { gameWins += 2; gameLosses += 1; }
      else if (g.score === '0-2') { gameWins += 0; gameLosses += 2; }
      else if (g.score === '1-2') { gameWins += 1; gameLosses += 2; }
      else {
        // Sin score guardado, inferir del resultado
        if (g.result === 'win') gameWins += 2;
        else gameLosses += 2;
      }
    });
    const totalGames = gameWins + gameLosses;
    const gameWinrate = totalGames > 0 ? Math.round((gameWins / totalGames) * 100) : null;

    return { roundWins, roundLosses, totalRounds, roundWinrate, gameWins, gameLosses, gameWinrate };
  }, [filteredGames]);

  const handleSave = async (gameData) => {
    setSaveError('');
    try {
      await addGame(gameData);
    } catch (err) {
      setSaveError(err.message);
      throw err;
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Historial de partidas</h1>
          <p style={styles.subtitle}>Todas tus partidas registradas</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
          + Añadir partida
        </button>
      </div>

      {/* Stats summary */}
      {stats.totalRounds > 0 && (
        <div style={styles.summaryWrapper}>
          {/* Rondas */}
          <div style={styles.summaryBlock}>
            <div style={styles.summaryBlockTitle}>Rondas</div>
            <div style={styles.summaryRow}>
              <div style={styles.stat}>
                <span style={styles.statValue}>{stats.totalRounds}</span>
                <span style={styles.statLabel}>Jugadas</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <span style={{ ...styles.statValue, color: '#4ade80' }}>{stats.roundWins}</span>
                <span style={styles.statLabel}>Ganadas</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <span style={{ ...styles.statValue, color: '#f87171' }}>{stats.roundLosses}</span>
                <span style={styles.statLabel}>Perdidas</span>
              </div>
              {stats.roundWinrate !== null && (
                <>
                  <div style={styles.statDivider} />
                  <div style={styles.stat}>
                    <span style={{ ...styles.statValue, color: stats.roundWinrate >= 50 ? '#4ade80' : '#f87171' }}>
                      {stats.roundWinrate}%
                    </span>
                    <span style={styles.statLabel}>Winrate</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Partidas individuales */}
          <div style={styles.summaryBlock}>
            <div style={styles.summaryBlockTitle}>Partidas individuales</div>
            <div style={styles.summaryRow}>
              <div style={styles.stat}>
                <span style={{ ...styles.statValue, color: '#4ade80' }}>{stats.gameWins}</span>
                <span style={styles.statLabel}>Ganadas</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <span style={{ ...styles.statValue, color: '#f87171' }}>{stats.gameLosses}</span>
                <span style={styles.statLabel}>Perdidas</span>
              </div>
              {stats.gameWinrate !== null && (
                <>
                  <div style={styles.statDivider} />
                  <div style={styles.stat}>
                    <span style={{ ...styles.statValue, color: stats.gameWinrate >= 50 ? '#4ade80' : '#f87171' }}>
                      {stats.gameWinrate}%
                    </span>
                    <span style={styles.statLabel}>Winrate</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {games.length > 0 && (
        <GameFilters decks={decks} onFilterChange={setFilters} />
      )}

      {/* Content */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Cargando partidas...</p>
        </div>
      ) : error ? (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      ) : (
        <GameHistory
          games={filteredGames}
          decks={decks}
          onDelete={deleteGame}
        />
      )}

      {/* Add modal */}
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

const styles = {
  page: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  headerLeft: {},
  title: {
    margin: '0 0 6px',
    fontSize: '28px',
    fontWeight: 700,
    color: '#e8e0d0',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.35)',
  },
  addBtn: {
    background: 'rgba(139, 92, 246, 0.85)',
    border: '1px solid rgba(139, 92, 246, 0.5)',
    borderRadius: '8px',
    padding: '10px 20px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  summaryWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  summaryBlock: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '16px 24px',
  },
  summaryBlockTitle: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.25)',
    marginBottom: '12px',
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    minWidth: '64px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#e8e0d0',
    lineHeight: 1,
    letterSpacing: '-0.03em',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'rgba(255,255,255,0.3)',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    background: 'rgba(255,255,255,0.08)',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '64px 0',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '14px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTop: '2px solid rgba(139, 92, 246, 0.8)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: '8px',
    padding: '16px 20px',
    color: '#f87171',
    fontSize: '14px',
  },
};

export default GameHistoryPage;
