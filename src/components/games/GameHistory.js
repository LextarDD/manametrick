import React, { useState } from 'react';

const RESULTS = {
  win:  { label: 'Victoria', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  dot: '#4ade80' },
  loss: { label: 'Derrota',  color: '#f87171', bg: 'rgba(248,113,113,0.12)', dot: '#f87171' },
};

// Color compartido para arquetipos (tuyo y rival)
const ARCH_COLOR = '#7dd3fc';

const GameHistory = ({ games, decks, onDelete }) => {
  const [expandedNote, setExpandedNote] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!games || games.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>⚔️</div>
        <p style={styles.emptyText}>No hay partidas registradas</p>
        <p style={styles.emptySubtext}>Registra tu primera partida con el botón de arriba</p>
      </div>
    );
  }

  const handleDelete = async (gameId) => {
    try {
      await onDelete(gameId);
      setConfirmDelete(null);
    } catch (err) {
      alert('Error al eliminar la partida: ' + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.count}>
        {games.length} ronda{games.length !== 1 ? 's' : ''}
      </div>
      <div style={styles.list}>
        {games.map((game) => {
          const result = RESULTS[game.result] || RESULTS.loss;
          const date = game.created_at
            ? new Date(game.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';

          const isTournament = !!game.tournament_id;
          const hasNote = game.note && game.note.trim().length > 0;
          const noteOpen = expandedNote === game.id;

          // Arquetipo propio del mazo
          const myArchetype = game.archetype || null;
          // Nombre del oponente si existe
          const opponentName = game.opponent_name && game.opponent_name.trim()
            ? game.opponent_name.trim()
            : null;

          return (
            <div key={game.id} style={styles.row}>
              {/* Result badge */}
              <div style={{ ...styles.resultBadge, background: result.bg, borderColor: result.color + '40', color: result.color }}>
                <span style={{ ...styles.resultDot, background: result.dot }} />
                {game.score ? game.score : result.label}
              </div>

              {/* Main info */}
              <div style={styles.info}>
                <div style={styles.matchup}>
                  {/* Mazo + arquetipo propio */}
                  <span style={styles.deckName}>{game.deck_name || '—'}</span>
                  {myArchetype && (
                    <span style={{ ...styles.archBadge, color: ARCH_COLOR }}>
                      {myArchetype}
                    </span>
                  )}
                  <span style={styles.vs}>vs</span>
                  {/* Arquetipo rival + nombre oponente */}
                  <span style={{ ...styles.opponent, color: ARCH_COLOR }}>
                    {game.opponent_archetype || '—'}
                  </span>
                  {opponentName && (
                    <span style={styles.opponentName}>
                      · {opponentName}
                    </span>
                  )}
                </div>
                <div style={styles.meta}>
                  <span style={styles.metaItem}>{date}</span>
                  {game.score && (
                    <span style={{ ...styles.metaItem, color: game.result === 'win' ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)' }}>
                      <span style={styles.metaDot}>·</span> {result.label}
                    </span>
                  )}
                  {isTournament && (
                    <span style={{ ...styles.metaItem, ...styles.tournamentBadge }}>
                      🏆 Torneo
                    </span>
                  )}
                </div>
              </div>

              {/* Note toggle */}
              {hasNote && (
                <button style={styles.noteBtn} onClick={() => setExpandedNote(noteOpen ? null : game.id)} title={noteOpen ? 'Ocultar nota' : 'Ver nota'}>
                  📝
                </button>
              )}

              {/* Delete */}
              {!isTournament && (
                <div style={styles.deleteArea}>
                  {confirmDelete === game.id ? (
                    <div style={styles.confirmRow}>
                      <span style={styles.confirmText}>¿Eliminar?</span>
                      <button style={styles.confirmYes} onClick={() => handleDelete(game.id)}>Sí</button>
                      <button style={styles.confirmNo} onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
                  ) : (
                    <button style={styles.deleteBtn} onClick={() => setConfirmDelete(game.id)} title="Eliminar partida">✕</button>
                  )}
                </div>
              )}

              {/* Expanded note */}
              {hasNote && noteOpen && (
                <div style={styles.noteExpanded}>
                  <span style={styles.noteLabel}>Nota:</span> {game.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 0 },
  count: { fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  list: { display: 'flex', flexDirection: 'column', gap: 2 },
  row: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, flexWrap: 'wrap', transition: 'background 0.15s', position: 'relative' },
  resultBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', minWidth: 56, justifyContent: 'center', flexShrink: 0 },
  resultDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  matchup: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  deckName: { color: '#e8e0d0', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 },
  archBadge: { fontSize: 12, fontWeight: 600, opacity: 0.85, whiteSpace: 'nowrap' },
  vs: { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 },
  opponent: { fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 },
  opponentName: { fontSize: 13, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 },
  meta: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaItem: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  metaDot: { marginRight: 2 },
  tournamentBadge: { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '1px 7px', borderRadius: 10, border: '1px solid rgba(251,191,36,0.25)', fontWeight: 600 },
  noteBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1, flexShrink: 0 },
  deleteArea: { flexShrink: 0 },
  deleteBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 9px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  confirmRow: { display: 'flex', alignItems: 'center', gap: 6 },
  confirmText: { fontSize: 12, color: '#f87171', fontWeight: 600 },
  confirmYes: { background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 4, padding: '3px 8px', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  confirmNo: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, padding: '3px 8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  noteExpanded: { width: '100%', marginTop: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: '#c8bfaf', lineHeight: 1.5 },
  noteLabel: { fontWeight: 700, color: 'rgba(255,255,255,0.45)' },
  empty: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.3)' },
  emptyIcon: { fontSize: 40, marginBottom: 16, opacity: 0.5 },
  emptyText: { fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' },
  emptySubtext: { fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 },
};

export default GameHistory;