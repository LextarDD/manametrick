import React, { useState } from 'react';

const PAGE_SIZE = 6;

const TournamentHistory = ({ tournaments, games = [], onDelete, onEdit }) => {
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  // Ahora cada game en BD = 1 ronda completa con result (win/loss/draw) y score
  // Calculamos rondas directamente contando games por torneo
  const statsById = {};
  games.forEach(g => {
    if (!g.tournament_id) return;
    if (!statsById[g.tournament_id]) {
      statsById[g.tournament_id] = { roundWins: 0, roundLosses: 0, roundDraws: 0 };
    }
    const s = statsById[g.tournament_id];
    if (g.result === 'win')  s.roundWins++;
    else if (g.result === 'loss') s.roundLosses++;
    else if (g.result === 'draw') s.roundDraws++;
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

  const totalPages = Math.ceil(tournaments.length / PAGE_SIZE);
  const paginated  = tournaments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: totalPages > 1 ? 16 : 0 }}>
        {paginated.map((t) => {
          const s = statsById[t.id] || { roundWins: 0, roundLosses: 0, roundDraws: 0 };
          const totalRounds = s.roundWins + s.roundLosses + s.roundDraws;
          const isConfirming = confirmId === t.id;

          const resultColor = s.roundWins > s.roundLosses
            ? '#22c55e'
            : s.roundLosses > s.roundWins
              ? '#ef4444'
              : totalRounds > 0 ? '#3b82f6' : '#aaa';

          // Score de rondas: W–L (–D si hay empates)
          const roundScore = totalRounds > 0
            ? s.roundDraws > 0
              ? `${s.roundWins}–${s.roundLosses}–${s.roundDraws}`
              : `${s.roundWins}–${s.roundLosses}`
            : '—';

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
                  {t.type === 'online' ? (
                    <span style={{ fontSize: 11, color: '#a5b4fc', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 4, padding: '1px 6px' }}>
                      🖥️ Online
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                      ⚔️ Físico
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rondas</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: resultColor }}>
                    {roundScore}
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageNavBtn(page === 1)}>←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={pageNumBtn(p === page)}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageNavBtn(page === totalPages)}>→</button>
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
  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
  color: disabled ? '#2a2a48' : '#6a6a9a', cursor: disabled ? 'default' : 'pointer',
  fontSize: 14, padding: '4px 10px', transition: 'all 0.15s',
});
const pageNumBtn = (active) => ({
  background: active ? 'rgba(108,87,255,0.2)' : 'transparent',
  border: `1px solid ${active ? 'rgba(108,87,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 6, color: active ? '#a89fff' : '#6a6a9a', cursor: 'pointer',
  fontSize: 13, fontWeight: active ? 600 : 400, padding: '4px 10px', minWidth: 32, transition: 'all 0.15s',
});

export default TournamentHistory;