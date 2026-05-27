import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Modal from '../shared/Modal';

const COLORS = {
  win: '#22c55e',
  loss: '#ef4444',
};

const ArchetypeDetails = ({ archetype, allStats, matchupMatrix, onClose, filterTop8Only = false, top8Names = [] }) => {
  if (!archetype) return null;

  const stat = allStats?.find(s => s.archetype === archetype);

  const wins = stat ? parseInt(stat.wins) : 0;
  const losses = stat ? parseInt(stat.losses) : 0;
  const total = stat ? parseInt(stat.total) : 0;
  const winrate = stat ? parseFloat(stat.winrate) : 0;

  const pieData = [
    { name: 'Victorias', value: wins },
    { name: 'Derrotas', value: losses },
  ].filter(d => d.value > 0);

  const matchups = (matchupMatrix || [])
    .filter(row => {
      if (row.player_archetype !== archetype) return false;
      if (filterTop8Only && top8Names.length > 0) {
        return top8Names.includes(row.opponent_archetype);
      }
      return true;
    })
    .sort((a, b) => parseFloat(b.winrate) - parseFloat(a.winrate));

  const getMatchupColor = (wr) => {
    const v = parseFloat(wr);
    if (v >= 60) return '#16a34a';
    if (v >= 53) return '#4ade80';
    if (v >= 47) return '#94a3b8';
    if (v >= 40) return '#fb923c';
    return '#ef4444';
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '1.5rem', minWidth: '320px', maxWidth: '560px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
              {archetype}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {total} partidas registradas
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-text-secondary)', padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {total === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Sin datos para este arquetipo.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '1.25rem' }}>
              {[
                { label: 'Winrate', value: `${winrate.toFixed(1)}%`, color: winrate >= 50 ? '#16a34a' : '#dc2626' },
                { label: 'Victorias', value: wins, color: '#16a34a' },
                { label: 'Derrotas', value: losses, color: '#dc2626' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '500', color }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ height: '200px', marginBottom: '1.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name === 'Victorias' ? 'win' : 'loss']} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} partidas`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {matchups.length > 0 && (
          <>
            <h3 style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 0.75rem', color: 'var(--color-text-primary)' }}>
              Matchups {filterTop8Only ? '(Top 8)' : ''}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
              {matchups.map(row => {
                const wr = parseFloat(row.winrate);
                const color = getMatchupColor(wr);
                return (
                  <div key={row.opponent_archetype} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-primary)' }}>{row.opponent_archetype}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{row.wins}W/{parseInt(row.total) - parseInt(row.wins)}L</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color, minWidth: '42px', textAlign: 'right' }}>{wr.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ArchetypeDetails;
