// src/components/stats/MatchupMatrix.js
import React from 'react';

const toNestedMap = (matrix) => {
  if (!matrix) return {};
  if (Array.isArray(matrix)) {
    const map = {};
    for (const row of matrix) {
      const p = row.player_archetype;
      const o = row.opponent_archetype;
      if (!p || !o) continue;
      if (!map[p]) map[p] = {};
      const wins    = parseInt(row.wins,  10) || 0;
      const total   = parseInt(row.total, 10) || 0;
      const winrate = total > 0 ? parseFloat(row.winrate) : null;
      map[p][o] = { wins, losses: total - wins, draws: 0, total, winrate };
    }
    return map;
  }
  return matrix;
};

const getCell = (winrate) => {
  if (winrate === null || winrate === undefined)
    return { bg: 'transparent', text: '#475569', border: 'rgba(255,255,255,0.06)' };
  const wr = parseFloat(winrate);
  if (wr >= 60) return { bg: 'rgba(34,197,94,0.18)',    text: '#4ade80', border: 'rgba(34,197,94,0.35)' };
  if (wr >= 53) return { bg: 'rgba(34,197,94,0.08)',    text: '#86efac', border: 'rgba(34,197,94,0.2)' };
  if (wr >= 47) return { bg: 'rgba(148,163,184,0.08)',  text: '#94a3b8', border: 'rgba(148,163,184,0.15)' };
  if (wr >= 40) return { bg: 'rgba(251,146,60,0.12)',   text: '#fb923c', border: 'rgba(251,146,60,0.3)' };
  return           { bg: 'rgba(248,113,113,0.15)',   text: '#f87171', border: 'rgba(248,113,113,0.35)' };
};

const STICKY_BG = '#0e1420';

const MatchupMatrix = ({ matrix, archetypeList, onSelectArchetype }) => {
  if (!matrix || !archetypeList || archetypeList.length === 0) {
    return <p style={{ color: '#475569', fontSize: '14px', padding: '1rem 0' }}>No hay datos de matchups disponibles todavía.</p>;
  }

  const matrixMap = toNestedMap(matrix);

  return (
    <div style={{
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #0d1117 100%)',
      border: '1px solid rgba(99,102,241,0.2)',
      boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      position: 'relative', overflow: 'auto', maxHeight: '80vh',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)',
        pointerEvents: 'none', zIndex: 40,
      }} />

      <table style={{ borderCollapse: 'collapse', tableLayout: 'auto', position: 'relative' }}>
        <thead>
          <tr>
            <th style={{
              padding: '14px 16px', fontSize: '10px', fontWeight: 600, color: '#475569',
              textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.08em', textTransform: 'uppercase',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: STICKY_BG, position: 'sticky', top: 0, left: 0, zIndex: 30,
            }}>
              ↓ Jugando / Contra →
            </th>
            {archetypeList.map(arch => (
              <th key={arch} style={{
                padding: '10px 8px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#94a3b8',
                textAlign: 'center',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                height: '120px',
                whiteSpace: 'nowrap',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                borderLeft: '1px solid rgba(255,255,255,0.04)',
                background: STICKY_BG,
                letterSpacing: '0.03em',
                position: 'sticky', top: 0, zIndex: 20,
              }}>
                {arch}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {archetypeList.map((playerArch, rowIdx) => (
            <tr key={playerArch} style={{
              borderBottom: rowIdx < archetypeList.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <td style={{
                padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1',
                whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.06)',
                background: STICKY_BG, letterSpacing: '0.01em',
                position: 'sticky', left: 0, zIndex: 10,
              }}>
                {playerArch}
              </td>

              {archetypeList.map(oppArch => {
                if (playerArch === oppArch) {
                  return (
                    <td key={oppArch} style={{
                      padding: '12px 8px', textAlign: 'center',
                      borderLeft: '1px solid rgba(255,255,255,0.04)',
                      background: 'rgba(99,102,241,0.06)', minWidth: '64px',
                    }}>
                      <span style={{ color: '#334155', fontSize: '16px', fontWeight: 300 }}>—</span>
                    </td>
                  );
                }

                const data   = matrixMap[playerArch]?.[oppArch];
                const wr     = data?.winrate ?? null;
                const { bg, text, border } = getCell(wr);
                const hasData = wr !== null;
                const label  = hasData ? `${parseFloat(wr).toFixed(0)}%` : '?';
                const draws  = data?.draws ?? 0;

                return (
                  <td
                    key={oppArch}
                    onClick={() => hasData && onSelectArchetype && onSelectArchetype(playerArch, oppArch)}
                    title={hasData
                      ? `${playerArch} vs ${oppArch}: ${data.wins}V / ${data.losses ?? (data.total - data.wins)}D${draws > 0 ? ` / ${draws}E` : ''} (${label})`
                      : `${playerArch} vs ${oppArch}: sin datos`}
                    style={{
                      padding: '12px 8px', textAlign: 'center',
                      borderLeft: '1px solid rgba(255,255,255,0.04)',
                      background: bg,
                      cursor: hasData ? 'pointer' : 'default',
                      transition: 'all 0.15s ease', minWidth: '64px',
                    }}
                    onMouseEnter={e => {
                      if (hasData) {
                        e.currentTarget.style.filter = 'brightness(1.3)';
                        e.currentTarget.style.outline = `1px solid ${border}`;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.filter = 'none';
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    <span style={{
                      fontSize: '13px', fontWeight: hasData ? 700 : 400, color: text,
                      fontVariantNumeric: 'tabular-nums', letterSpacing: hasData ? '-0.02em' : '0',
                    }}>
                      {label}
                    </span>
                    {hasData && data?.total && (
                      <div style={{ fontSize: '9px', color: text, opacity: 0.5, marginTop: '1px', fontWeight: 400 }}>
                        {data.total}gg
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MatchupMatrix;