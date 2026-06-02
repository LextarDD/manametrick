// src/components/stats/GlobalMatchupDetails.js
import React from 'react';
import Modal from '../shared/Modal';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = { win: '#4ade80', loss: '#f87171' };

const GlobalMatchupDetails = ({ playerArch, oppArch, matchupMatrix, onClose }) => {
  if (!playerArch || !oppArch) return null;

  // Buscar la fila del array SQL para playerArch vs oppArch
  const row = (matchupMatrix || []).find(
    r => r.player_archetype === playerArch && r.opponent_archetype === oppArch
  );

  const wins    = row ? parseInt(row.wins,  10) : 0;
  const total   = row ? parseInt(row.total, 10) : 0;
  const losses  = total - wins;
  const winrate = row && total > 0 ? parseFloat(row.winrate) : null;
  const winrateColor = winrate !== null ? (winrate >= 50 ? '#4ade80' : '#f87171') : '#64748b';
  const winrateLabel = winrate !== null ? `${winrate.toFixed(1)}%` : '—';

  const pieData = total > 0
    ? [{ name: 'Victorias', value: wins }, { name: 'Derrotas', value: losses }]
    : [{ name: 'Sin datos', value: 1 }];
  const pieColors = total > 0 ? [COLORS.win, COLORS.loss] : ['#1e293b'];

  const barRows = total > 0 ? [
    { label: 'Victorias', value: wins,   color: COLORS.win,  pct: wins   / total * 100 },
    { label: 'Derrotas',  value: losses, color: COLORS.loss, pct: losses / total * 100 },
  ] : [];

  const statPills = [
    { label: 'Winrate',   value: winrateLabel, color: winrateColor },
    { label: 'Victorias', value: wins,          color: '#4ade80' },
    { label: 'Derrotas',  value: losses,        color: '#f87171' },
    { label: 'Partidas',  value: total,         color: '#94a3b8' },
  ];

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", minWidth: '320px', maxWidth: '520px', width: '100%' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: '12px 12px 0 0',
          padding: '24px 28px 20px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '0.7rem', color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Matchup global
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>
            {playerArch} <span style={{ color: '#475569' }}>vs</span> {oppArch}
          </h2>
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
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {statPills.map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#1e293b', borderRadius: '10px', padding: '12px 14px', flex: '1', minWidth: '64px', textAlign: 'center', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}>

                {/* Dona con label central */}
                <div style={{ position: 'relative', height: '160px', marginBottom: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={44} outerRadius={66}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90} endAngle={-270}
                        isAnimationActive={false}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={pieColors[i]} strokeWidth={0} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Label central */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: winrateColor, lineHeight: 1.1 }}>
                      {winrateLabel}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.05em', marginTop: '2px' }}>
                      winrate
                    </span>
                  </div>
                </div>

                {/* Barras horizontales */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {barRows.map(({ label, value, color, pct }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', width: '60px', textAlign: 'right', flexShrink: 0 }}>{label}</span>
                      <div style={{ flex: 1, height: '26px', background: 'rgba(255,255,255,0.04)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.max(pct, 0)}%`, height: '100%',
                          background: color + '38', borderRadius: '5px',
                          display: 'flex', alignItems: 'center', paddingLeft: '8px',
                          minWidth: pct > 0 ? '44px' : '0',
                        }}>
                          {pct > 0 && <span style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{pct.toFixed(1)}%</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#475569', width: '16px', textAlign: 'right', flexShrink: 0 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Leyenda */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  {barRows.map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', transition: 'all 0.2s' }}
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

export default GlobalMatchupDetails;