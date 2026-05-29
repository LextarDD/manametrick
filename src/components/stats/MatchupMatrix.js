import React from 'react';

const getCell = (winrate) => {
  if (winrate === null || winrate === undefined) {
    return { bg: 'transparent', text: '#475569', border: 'rgba(255,255,255,0.06)', label: '?' };
  }
  const wr = parseFloat(winrate);
  if (wr >= 60) return { bg: 'rgba(34,197,94,0.18)',  text: '#4ade80', border: 'rgba(34,197,94,0.35)' };
  if (wr >= 53) return { bg: 'rgba(34,197,94,0.08)',  text: '#86efac', border: 'rgba(34,197,94,0.2)' };
  if (wr >= 47) return { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8', border: 'rgba(148,163,184,0.15)' };
  if (wr >= 40) return { bg: 'rgba(251,146,60,0.12)', text: '#fb923c', border: 'rgba(251,146,60,0.3)' };
  return            { bg: 'rgba(248,113,113,0.15)',  text: '#f87171', border: 'rgba(248,113,113,0.35)' };
};

const MatchupMatrix = ({ matrix, archetypeList, onSelectArchetype }) => {
  if (!matrix || !archetypeList || archetypeList.length === 0) {
    return (
      <p style={{ color: '#475569', fontSize: '14px', padding: '1rem 0' }}>
        No hay datos de matchups disponibles todavía.
      </p>
    );
  }

  let matrixMap = {};
  if (Array.isArray(matrix)) {
    matrix.forEach(row => {
      if (!matrixMap[row.player_archetype]) matrixMap[row.player_archetype] = {};
      matrixMap[row.player_archetype][row.opponent_archetype] = row;
    });
  } else {
    matrixMap = matrix;
  }

  return (
    <div className="matchup-matrix-scroll" style={{
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #0d1117 100%)',
      border: '1px solid rgba(99,102,241,0.2)',
      boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      position: 'relative',
    }}>
      {/* Subtle corner glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)',
        pointerEvents: 'none',
      }} />

      <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto', position: 'relative' }}>
        <thead>
          <tr>
            <th style={{
              padding: '14px 16px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#475569',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              ↓ Jugando / Contra →
            </th>
            {archetypeList.map(arch => (
              <th key={arch} style={{
                padding: '8px 6px',
                fontSize: '11px',
                fontWeight: 500,
                color: '#64748b',
                textAlign: 'center',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                height: '90px',
                whiteSpace: 'nowrap',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                borderLeft: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(255,255,255,0.02)',
                letterSpacing: '0.02em',
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
              {/* Row header */}
              <td style={{
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                whiteSpace: 'nowrap',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                letterSpacing: '0.01em',
              }}>
                {playerArch}
              </td>

              {archetypeList.map(oppArch => {
                if (playerArch === oppArch) {
                  return (
                    <td key={oppArch} style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      borderLeft: '1px solid rgba(255,255,255,0.04)',
                      background: 'rgba(99,102,241,0.06)',
                      minWidth: '60px',
                    }}>
                      <span style={{ color: '#334155', fontSize: '16px', fontWeight: 300 }}>—</span>
                    </td>
                  );
                }

                const data = matrixMap[playerArch]?.[oppArch];
                const wr = data?.winrate ?? null;
                const { bg, text, border } = getCell(wr);
                const label = wr !== null ? `${parseFloat(wr).toFixed(0)}%` : '?';
                const hasData = wr !== null;

                return (
                  <td
                    key={oppArch}
                    onClick={() => onSelectArchetype && onSelectArchetype(playerArch, oppArch)}
                    title={data
                      ? `${playerArch} vs ${oppArch}: ${data.wins}W / ${data.total - data.wins}L (${label})`
                      : `${playerArch} vs ${oppArch}: sin datos`}
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      borderLeft: '1px solid rgba(255,255,255,0.04)',
                      background: bg,
                      cursor: hasData ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      minWidth: '60px',
                    }}
                    onMouseEnter={e => {
                      if (hasData) {
                        e.currentTarget.style.background = bg.replace(/[\d.]+\)$/, v => {
                          const n = parseFloat(v); return `${Math.min(n + 0.15, 0.5)})`;
                        });
                        e.currentTarget.style.outline = `1px solid ${border}`;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = bg;
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    <span style={{
                      fontSize: '13px',
                      fontWeight: hasData ? 700 : 400,
                      color: text,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: hasData ? '-0.02em' : '0',
                    }}>
                      {label}
                    </span>
                    {hasData && data?.total && (
                      <div style={{
                        fontSize: '9px',
                        color: text,
                        opacity: 0.5,
                        marginTop: '1px',
                        letterSpacing: '0',
                        fontWeight: 400,
                      }}>
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