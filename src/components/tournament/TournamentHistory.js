import React, { useState } from 'react';

const TournamentHistory = ({ tournaments, games = [], onDelete, onEdit }) => {
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Calcular resultado POR RONDAS (no por partidas individuales)
  // Agrupamos las partidas de cada torneo por opponent_archetype (= una ronda)
  // y determinamos si esa ronda se ganó o perdió (≥2 wins = ronda ganada)
  const roundScoreMap = {};
  const gameScoreMap = {};

  // Primero agrupar partidas por torneo y por ronda (opponent + orden)
  // Usamos un Map ordenado para preservar el orden de inserción
  const tournamentRounds = {};

  games.forEach(g => {
    if (!g.tournament_id) return;

    // Score de partidas individuales
    if (!gameScoreMap[g.tournament_id]) gameScoreMap[g.tournament_id] = { wins: 0, losses: 0 };
    if (g.result === 'win') gameScoreMap[g.tournament_id].wins++;
    else gameScoreMap[g.tournament_id].losses++;

    // Agrupar por torneo
    if (!tournamentRounds[g.tournament_id]) tournamentRounds[g.tournament_id] = [];
    tournamentRounds[g.tournament_id].push(g);
  });

  // Para cada torneo, reconstruir rondas y calcular resultado
  Object.entries(tournamentRounds).forEach(([tid, tGames]) => {
    // Agrupar por opponent_archetype manteniendo orden de created_at
    const roundMap = new Map();
    [...tGames]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .forEach(g => {
        // Clave única por ronda: opponent_archetype + índice de aparición
        // Para soportar múltiples rondas contra el mismo arquetipo usamos un contador
        const baseKey = g.opponent_archetype || 'unknown';
        // Buscamos una ronda con menos de 3 resultados para este oponente
        let found = false;
        for (const [key, results] of roundMap.entries()) {
          if (key.startsWith(baseKey + '::') && results.length < 3) {
            results.push(g.result);
            found = true;
            break;
          }
        }
        if (!found) {
          roundMap.set(`${baseKey}::${roundMap.size}`, [g.result]);
        }
      });

    // Calcular resultado de cada ronda
    let roundWins = 0, roundLosses = 0;
    roundMap.forEach(results => {
      const w = results.filter(r => r === 'win').length;
      const l = results.filter(r => r === 'loss').length;
      if (w >= 2) roundWins++;
      else if (l >= 2) roundLosses++;
      // rondas incompletas no cuentan
    });

    roundScoreMap[tid] = { wins: roundWins, losses: roundLosses };
  });

  const handleConfirmDelete = async (id) => {
    setDeleting(true);
    try { await onDelete(id); }
    finally { setDeleting(false); setConfirmId(null); }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  if (!tournaments.length) {
    return (
      <div style={{ color: '#555', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
        No hay torneos registrados todavía.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tournaments.map((t) => {
        const rounds = roundScoreMap[t.id] || { wins: 0, losses: 0 };
        const games_ = gameScoreMap[t.id]  || { wins: 0, losses: 0 };
        const totalRounds = rounds.wins + rounds.losses;
        const isConfirming = confirmId === t.id;

        // Color según resultado de rondas
        const resultColor = rounds.wins > rounds.losses
          ? '#22c55e'
          : rounds.losses > rounds.wins
            ? '#ef4444'
            : '#aaa';

        return (
          <div
            key={t.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Fecha */}
            <span style={{ color: '#555', fontSize: 12, minWidth: 80, flexShrink: 0 }}>
              {formatDate(t.created_at)}
            </span>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {t.name && (
                  <span style={{ color: '#d4d4d4', fontWeight: 600, fontSize: 14 }}>{t.name}</span>
                )}
                <span style={{ fontSize: 12, color: '#888', background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 7px' }}>
                  {t.deck_name}
                </span>
              </div>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rondas</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: resultColor }}>
                  {totalRounds > 0 ? `${rounds.wins}–${rounds.losses}` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Partidas</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#94a3b8' }}>
                  {games_.wins + games_.losses > 0 ? `${games_.wins}–${games_.losses}` : '—'}
                </span>
              </div>
            </div>

            {/* Acciones */}
            {!isConfirming ? (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => onEdit && onEdit(t)} title="Editar torneo" style={iconBtnStyle}
                  onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#555'}>✏</button>
                <button onClick={() => setConfirmId(t.id)} title="Eliminar torneo" style={iconBtnStyle}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#555'}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: '#f87171' }}>¿Eliminar?</span>
                <button disabled={deleting} onClick={() => handleConfirmDelete(t.id)}
                  style={{ background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, padding: '3px 10px', borderRadius: 5, fontWeight: 600 }}>
                  {deleting ? '...' : 'Sí'}
                </button>
                <button onClick={() => setConfirmId(null)}
                  style={{ background: 'transparent', border: '1px solid #333', color: '#888', cursor: 'pointer', fontSize: 12, padding: '3px 10px', borderRadius: 5 }}>
                  No
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const iconBtnStyle = {
  background: 'transparent', border: 'none', color: '#555',
  cursor: 'pointer', fontSize: 15, padding: '2px 4px',
  borderRadius: 4, lineHeight: 1, transition: 'color 0.15s', flexShrink: 0,
};

export default TournamentHistory;