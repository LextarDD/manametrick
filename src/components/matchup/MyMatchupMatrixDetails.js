// src/components/matchup/MyMatchupMatrixDetails.js
import React, { useMemo } from 'react';
import Modal from '../shared/Modal';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { win: '#4ade80', loss: '#f87171' };

const MyMatchupMatrixDetails = ({ user, playerArch, oppArch, games, onClose }) => {
  const stats = useMemo(() => {
    if (!games || !playerArch || !oppArch) return null;

    // Todas las partidas entre estos dos arquetipos, desde cualquier perspectiva
    const allGames = games.filter(g =>
      (g.archetype === playerArch && g.opponent_archetype === oppArch) ||
      (g.archetype === oppArch && g.opponent_archetype === playerArch)
    );

    // Normalizar: desde la perspectiva de playerArch
    // Si la partida fue registrada al revés, invertir el resultado
    const normalized = allGames.map(g => {
      const isCanonical = g.archetype === playerArch;
      return {
        ...g,
        result: isCanonical ? g.result : (g.result === 'win' ? 'loss' : 'win'),
        _perspective: isCanonical ? playerArch : oppArch,
      };
    });

    const wins   = normalized.filter(g => g.result === 'win').length;
    const losses = normalized.filter(g => g.result === 'loss').length;
    const total  = normalized.length;
    const winrate = total > 0 ? Math.round((wins / total) * 1000) / 10 : null;

    return {
      wins, losses, total, winrate,
      recentGames: [...normalized]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10),
    };
  }, [games, playerArch, oppArch]);

  if (!stats) return null;

  const { wins, losses, total, winrate, recentGames } = stats;

  const pieData = total > 0
    ? [{ name: 'Victorias', value: wins }, { name: 'Derrotas', value: losses }]
    : [];

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", minWidth: '320px', maxWidth: '520px', width: '100%' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: '12px 12px 0 0',
          padding: '24px 28px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '0.7rem', color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Matchup combinado
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>
            {playerArch} <span style={{ color: '#475569' }}>vs</span> {oppArch}
          </h2>
          <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#64748b' }}>
            {total} partida{total !== 1 ? 's' : ''} en total (ambas perspectivas)
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', background: '#0f172a', borderRadius: '0 0 12px 12px' }}>
          {total === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: '0.95rem', fontStyle: 'italic' }}>
              No hay partidas registradas entre {playerArch} y {oppArch}.
            </div>
          ) : (
            <>
              {/* Stat pills */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { label: 'Winrate', value: `${winrate}%`, color: winrate >= 50 ? '#4ade80' : '#f87171' },
                  { label: 'Victorias', value: wins, color: '#4ade80' },
                  { label: 'Derrotas', value: losses, color: '#f87171' },
                  { label: 'Total', value: total, color: '#94a3b8' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#1e293b', borderRadius: '10px', padding: '12px 16px', flex: '1', minWidth: '70px', textAlign: 'center', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Pie */}
              <div style={{ marginBottom: '20px' }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? COLORS.win : COLORS.loss} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                    <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Historial */}
              {recentGames.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
                    Últimas partidas
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {recentGames.map((game, idx) => (
                      <div key={game.id ?? idx} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '7px 12px', background: '#1e293b', borderRadius: '7px',
                        border: `1px solid ${game.result === 'win' ? '#166534' : '#7f1d1d'}`,
                        fontSize: '0.82rem',
                      }}>
                        <span style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: game.result === 'win' ? '#166534' : '#7f1d1d',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: game.result === 'win' ? '#4ade80' : '#f87171',
                          fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                        }}>
                          {game.result === 'win' ? 'V' : 'D'}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.72rem', flexShrink: 0 }}>
                          {game._perspective === playerArch ? playerArch : oppArch}
                        </span>
                        <span style={{ color: '#cbd5e1', flex: 1 }}>{game.deck_name || '—'}</span>
                        <span style={{ color: '#475569', fontSize: '0.72rem' }}>
                          {game.created_at ? new Date(game.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={onClose}
            style={{ marginTop: '20px', width: '100%', padding: '11px', background: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = '#1e293b'; e.target.style.color = '#f1f5f9'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8'; }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MyMatchupMatrixDetails;