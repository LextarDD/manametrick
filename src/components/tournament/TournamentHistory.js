import React, { useState } from 'react';

const PAGE_SIZE = 6;

const TournamentHistory = ({ tournaments, games = [], onDelete, onEdit }) => {
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const roundScoreMap = {};
  const gameScoreMap = {};
  const tournamentRounds = {};

  games.forEach(g => {
    if (!g.tournament_id) return;
    if (!gameScoreMap[g.tournament_id]) gameScoreMap[g.tournament_id] = { wins: 0, losses: 0 };
    if (g.result === 'win') gameScoreMap[g.tournament_id].wins++;
    else gameScoreMap[g.tournament_id].losses++;
    if (!tournamentRounds[g.tournament_id]) tournamentRounds[g.tournament_id] = [];
    tournamentRounds[g.tournament_id].push(g);
  });

  Object.entries(tournamentRounds).forEach(([tid, tGames]) => {
    const roundMap = new Map();
    [...tGames]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .forEach(g => {
        const baseKey = g.opponent_archetype || 'unknown';
        let found = false;
        for (const [key, results] of roundMap.entries()) {
          if (key.startsWith(baseKey + '::') && results.length < 3) {
            results.push(g.result); found = true; break;
          }
        }
        if (!found) roundMap.set(`${baseKey}::${roundMap.size}`, [g.result]);
      });

    let roundWins = 0, roundLosses = 0;
    roundMap.forEach(results => {
      const w = results.filter(r => r === 'win').length;
      const l = results.filter(r => r === 'loss').length;
      if (w >= 2) roundWins++;
      else if (l >= 2) roundLosses++;
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

  // Pagination
  const totalPages = Math.ceil(tournaments.length / PAGE_SIZE);
  const paginated  = tournaments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: totalPages > 1 ? 16 : 0 }}>
        {paginated.map((t) => {
          const rounds   = roundScoreMap[t.id] || { wins: 0, losses: 0 };
          const games_   = gameScoreMap[t.id]  || { wins: 0, losses: 0 };
          const totalRounds  = rounds.wins + rounds.losses;
          const isConfirming = confirmId === t.id;

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
              <span style={{ color: '#555', fontSize: 12, minWidth: 80, flexShrink: 0 }}>
                {formatDate(t.created_at)}
              </span>

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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={pageNavBtn(page === 1)}
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={pageNumBtn(p === page)}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={pageNavBtn(page === totalPages)}
          >
            →
          </button>

          <span style={{ fontSize: 12, color: '#3a3a60', marginLeft: 8 }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, tournaments.length)} de {tournaments.length}
          </span>
        </div>
      )}
    </div>
  );
};

const iconBtnStyle = {
  background: 'transparent', border: 'none', color: '#555',
  cursor: 'pointer', fontSize: 15, padding: '2px 4px',
  borderRadius: 4, lineHeight: 1, transition: 'color 0.15s', flexShrink: 0,
};

const pageNavBtn = (disabled) => ({
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: disabled ? '#2a2a48' : '#6a6a9a',
  cursor: disabled ? 'default' : 'pointer',
  fontSize: 14,
  padding: '4px 10px',
  transition: 'all 0.15s',
});

const pageNumBtn = (active) => ({
  background: active ? 'rgba(108,87,255,0.2)' : 'transparent',
  border: `1px solid ${active ? 'rgba(108,87,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 6,
  color: active ? '#a89fff' : '#6a6a9a',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  padding: '4px 10px',
  minWidth: 32,
  transition: 'all 0.15s',
});

export default TournamentHistory;