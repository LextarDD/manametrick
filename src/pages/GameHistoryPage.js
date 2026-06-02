import React, { useState, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import useGames from '../hooks/useGames';
import useDecks from '../hooks/useDecks';
import useArchetypes from '../hooks/useArchetypes';
import GameHistory from '../components/games/GameHistory';
import GameFilters from '../components/games/GameFilters';
import AddGameModal from '../components/games/AddGameModal';
import useTournaments from '../hooks/useTournaments';
import ImportGamesModal from '../components/games/ImportGamesModal';
import { supabase } from '../lib/supabaseClient';

const exportToCSV = (games, tournamentMap) => {
  const headers = ['Fecha', 'Mazo', 'Arquetipo propio', 'Arquetipo rival', 'Oponente', 'Score', 'Torneo', 'Nota', '_tournament_id'];

  const rows = games.map(g => {
    const fecha = g.created_at
      ? new Date(g.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';
    const score = g.score && g.score.trim() ? g.score.trim() : (g.result === 'win' ? '2-0' : '0-2');
    const torneo = g.tournament_id ? (tournamentMap[g.tournament_id] || 'Torneo') : '';
    return [
      fecha,
      g.deck_name || '',
      g.archetype || '',
      g.opponent_archetype || '',
      g.opponent_name || '',
      score,
      torneo,
      g.note || '',
      g.tournament_id || '',
    ].map(val => `"${String(val).replace(/"/g, '""')}"`);
  });

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `partidas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const GameHistoryPage = () => {
  const { user } = useAuth();
  const { games, loading, error, addGame, deleteGame, refetch } = useGames(user?.id);
  const { decks } = useDecks(user?.id);
  const { tournaments } = useTournaments(user?.id);
  const tournamentMap = Object.fromEntries((tournaments || []).map(t => [t.id, t.name || 'Torneo']));
  const { archetypes } = useArchetypes();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    const roundDraws  = filteredGames.filter(g => g.result === 'draw').length;
    const total = roundWins + roundLosses + roundDraws;
    // Winrate de rondas: empates no cuentan como victoria ni derrota
    const roundWR = (roundWins + roundLosses) > 0
      ? Math.round(roundWins / (roundWins + roundLosses) * 100)
      : null;

    // Partidas individuales: derivadas del score de cada ronda
    // 2-0 = 2 games (2W 0L), 2-1 = 3 games (2W 1L), 0-2 = 2 games (0W 2L), 1-2 = 3 games (1W 2L), 1-1 = 2 games (1W 1L)
    let gW = 0, gL = 0, gD = 0;
    filteredGames.forEach(g => {
      const score = g.score || (g.result === 'win' ? '2-0' : g.result === 'draw' ? '1-1' : '0-2');
      if      (score === '2-0') { gW += 2; }
      else if (score === '2-1') { gW += 2; gL += 1; }
      else if (score === '0-2') { gL += 2; }
      else if (score === '1-2') { gW += 1; gL += 2; }
      else if (score === '1-1') { gW += 1; gL += 1; }
    });
    const totalG = gW + gL;
    const gameWR = totalG > 0 ? Math.round(gW / totalG * 100) : null;

    return { roundWins, roundLosses, roundDraws, total, roundWR, gW, gL, gameWR };
  }, [filteredGames]);

  const handleSave = async (gameData) => {
    setSaveError('');
    try { await addGame(gameData); }
    catch (err) { setSaveError(err.message); throw err; }
  };

  const handleImport = async ({ grouped, loose, onProgress, onError }) => {
    let totalGames = 0;
    let totalTournaments = 0;

    // Mapa nombre de mazo → deck para resolver deck_id
    const deckByName = {};
    (decks || []).forEach(d => { deckByName[d.name.trim().toLowerCase()] = d; });
    const resolveDeck = (name) => {
      if (!name) return { deck_id: null, deck_name: '' };
      const deck = deckByName[name.trim().toLowerCase()];
      return deck ? { deck_id: deck.id, deck_name: deck.name } : { deck_id: null, deck_name: name };
    };

    // Partidas sueltas
    for (const row of loose) {
      try {
        const { deck_id, deck_name } = resolveDeck(row.deck_name);
        await addGame({
          deck_name,
          deck_id,
          archetype:          row.archetype,
          opponent_archetype: row.opponent_archetype,
          opponent_name:      row.opponent_name || '',
          result:             row.result,
          score:              row.score,
          note:               row.note || '',
          tournament_id:      null,
          created_at:         row.created_at,
        });
        totalGames++;
      } catch (e) { onError(`Fila ${row._rowNum}: ${e.message}`); }
    }

    // Torneos agrupados
    for (const [, rows] of Object.entries(grouped)) {
      try {
        const tournamentName = rows[0]?.tournament_name || '';
        const { deck_id: tDeckId, deck_name: tDeckName } = resolveDeck(rows[0]?.deck_name);
        const { data: t, error: tErr } = await supabase
          .from('tournaments')
          .insert([{ user_id: user.id, deck_id: tDeckId, deck_name: tDeckName, name: tournamentName }])
          .select().single();
        if (tErr) throw new Error(tErr.message);

        const gameRows = rows.map(row => {
          const { deck_id, deck_name } = resolveDeck(row.deck_name);
          return {
            user_id:            user.id,
            deck_name,
            deck_id,
            archetype:          row.archetype,
            opponent_archetype: row.opponent_archetype,
            opponent_name:      row.opponent_name || '',
            result:             row.result,
            score:              row.score,
            note:               row.note || '',
            tournament_id:      t.id,
            created_at:         row.created_at,
          };
        });

        const { error: gErr } = await supabase.from('games').insert(gameRows);
        if (gErr) throw new Error(gErr.message);

        totalGames += rows.length;
        totalTournaments++;
      } catch (e) { onError(`Torneo: ${e.message}`); }
    }

    onProgress(totalGames, totalTournaments);
    await refetch();
  };

  const handleDeleteAll = async () => {
    try {
      const { error: gErr } = await supabase
        .from('games')
        .delete()
        .eq('user_id', user.id);
      if (gErr) throw new Error(gErr.message);

      const { error: tErr } = await supabase
        .from('tournaments')
        .delete()
        .eq('user_id', user.id);
      if (tErr) throw new Error(tErr.message);

      await refetch();
      setShowDeleteConfirm(false);
    } catch (e) {
      alert('Error al borrar el historial: ' + e.message);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Historial de <span className="gradient-text">Partidas</span></h1>
          <p className="page-subtitle">Todas tus rondas registradas</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {games.length > 0 && (
              <button
                className="btn btn-ghost"
                onClick={() => exportToCSV(filteredGames, tournamentMap)}
                title="Exportar partidas filtradas a Excel/CSV"
              >
                ↓ Exportar
              </button>
            )}
            <button
              className="btn btn-ghost"
              onClick={() => setShowImportModal(true)}
              title="Importar partidas desde CSV"
            >
              ↑ Importar
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              + Añadir ronda
            </button>
          </div>
          {games.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: 'none', border: 'none', color: 'rgba(224,85,85,0.45)',
                fontSize: 11, cursor: 'pointer', padding: '0 2px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(224,85,85,0.45)'}
            >
              🗑 Borrar historial
            </button>
          )}
        </div>
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
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
                <StatNum value={stats.total}       label="Jugadas"  color="var(--text-primary)" small />
                <Divider />
                <StatNum value={stats.roundWins}   label="Ganadas"  color="var(--accent-green)" small />
                <Divider />
                <StatNum value={stats.roundLosses} label="Perdidas" color="var(--accent-red)" small />
                {stats.roundDraws > 0 && (
                  <>
                    <Divider />
                    <StatNum value={stats.roundDraws} label="Empates" color="#3b82f6" small />
                  </>
                )}
                {stats.roundWR !== null && (
                  <>
                    <Divider />
                    <StatNum value={`${stats.roundWR}%`} label="Winrate" color={stats.roundWR >= 50 ? 'var(--accent-green)' : 'var(--accent-red)'} small />
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
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
                <StatNum value={stats.gW + stats.gL} label="Jugadas"  color="var(--text-primary)" small />
                <Divider />
                <StatNum value={stats.gW} label="Ganadas"  color="var(--accent-green)" small />
                <Divider />
                <StatNum value={stats.gL} label="Perdidas" color="var(--accent-red)" small />
                {stats.gameWR !== null && (
                  <>
                    <Divider />
                    <StatNum value={`${stats.gameWR}%`} label="Winrate" color={stats.gameWR >= 50 ? 'var(--accent-green)' : 'var(--accent-red)'} small />
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
                {filteredGames.length} ronda{filteredGames.length !== 1 ? 's' : ''}
                {filteredGames.length !== games.length && ` (filtradas de ${games.length})`}
              </span>
            </div>
            <GameHistory
              games={filteredGames}
              decks={decks}
              onDelete={deleteGame}
              tournaments={tournaments}
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f0a0a 0%, #1a0808 100%)',
            border: '1px solid rgba(224,85,85,0.4)',
            borderRadius: 16,
            padding: '32px 28px',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 0 0 1px rgba(224,85,85,0.15), 0 24px 64px rgba(224,85,85,0.2)',
            position: 'relative',
            textAlign: 'center',
          }}>
            {/* Top glow line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(224,85,85,0.6), transparent)',
              borderRadius: '16px 16px 0 0',
            }} />

            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f87171', margin: '0 0 10px', letterSpacing: '-0.03em' }}>
              ¿Borrar todo el historial?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.6 }}>
              Se eliminarán <strong style={{ color: 'var(--text-primary)' }}>{games.length} partidas</strong> de forma permanente.
            </p>
            <p style={{ fontSize: 12, color: 'rgba(224,85,85,0.7)', margin: '0 0 28px' }}>
              Esta acción no se puede deshacer.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ minWidth: 110 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                style={{
                  minWidth: 110,
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: '1px solid rgba(224,85,85,0.5)',
                  background: 'rgba(224,85,85,0.15)',
                  color: '#f87171',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.15)'; }}
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportGamesModal
          onClose={() => { setShowImportModal(false); }}
          onImport={handleImport}
        />
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

const StatNum = ({ value, label, color, small }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: small ? 40 : 56 }}>
    <span style={{ fontSize: small ? 20 : 22, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-.03em' }}>{value}</span>
    <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)' }}>{label}</span>
  </div>
);

const Divider = () => (
  <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,.06)', flexShrink: 0 }} />
);

export default GameHistoryPage;