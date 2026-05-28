import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useGlobalStats from '../hooks/useGlobalStats';
import useArchetypes from '../hooks/useArchetypes';

/* ── Type → visual mapping ── */
const TYPE_META = {
  aggro:    { color: 'amber',  dot: 'amber',  emoji: '⚔' },
  burn:     { color: 'red',    dot: 'red',    emoji: '🔥' },
  tribal:   { color: 'green',  dot: 'green',  emoji: '🐍' },
  combo:    { color: 'blue',   dot: 'blue',   emoji: '⚙' },
  control:  { color: 'purple', dot: 'purple', emoji: '✨' },
  midrange: { color: 'purple', dot: 'purple', emoji: '⚡' },
  tempo:    { color: 'blue',   dot: 'blue',   emoji: '💨' },
  prison:   { color: 'red',    dot: 'red',    emoji: '🔒' },
  storm:    { color: 'blue',   dot: 'blue',   emoji: '🌀' },
  ramp:     { color: 'green',  dot: 'green',  emoji: '🌿' },
};

const getMeta = (name, archetypeMap) => {
  const type = archetypeMap[name] || 'midrange';
  return { ...(TYPE_META[type] || TYPE_META.midrange), badge: type };
};

const wrColor = (wr) => {
  if (wr >= 60) return '#22c490';
  if (wr >= 50) return '#f0a030';
  return '#e05555';
};

const wrCellClass = (wr) => {
  if (wr >= 55) return 'favorable';
  if (wr >= 45) return 'neutral';
  return 'unfavorable';
};

const colRgb = (color) => {
  if (color === 'amber')  return '240,160,48';
  if (color === 'green')  return '34,196,144';
  if (color === 'red')    return '224,85,85';
  if (color === 'blue')   return '91,175,255';
  return '108,87,255';
};

const colText = (color) => {
  if (color === 'amber')  return '#d4892a';
  if (color === 'green')  return '#22c490';
  if (color === 'red')    return '#c04040';
  if (color === 'blue')   return '#4d9fd4';
  return '#9d8bff';
};

const HomePage = () => {
  const { archetypeStats, matchupMatrix, loading, error } = useGlobalStats();
  const { archetypeMap } = useArchetypes();
  const [filter, setFilter] = useState('all');
  const [tableOpen, setTableOpen] = useState(false);

  const displayed = filter === 'top8'
    ? [...(archetypeStats || [])].sort((a, b) => b.winrate - a.winrate).slice(0, 8)
    : archetypeStats || [];

  const allArchetypes = [...new Set((archetypeStats || []).map(a => a.archetype))];

  const matrixLookup = {};
  (matchupMatrix || []).forEach(row => {
    if (!matrixLookup[row.player_archetype]) matrixLookup[row.player_archetype] = {};
    matrixLookup[row.player_archetype][row.opponent_archetype] = row;
  });

  const totalPartidas = (archetypeStats || []).reduce((sum, a) => sum + Number(a.total || 0), 0) / 2 | 0;
  const topWR = archetypeStats?.length ? Math.max(...archetypeStats.map(a => Number(a.winrate || 0))).toFixed(1) : '—';

  return (
    <div className="page-wide">

      {/* ── Header ── */}
      <div className="anim-fade-up" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8e3ff', marginBottom: 5, letterSpacing: '-.5px' }}>
          Meta Pauper — <span className="gradient-text">Estadísticas globales</span>
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
          Datos en tiempo real de la comunidad · Winrates calculados sobre todas las partidas registradas
        </p>
        <div className="stat-chips">
          <div className="stat-chip purple">
            <div className="stat-chip-value">{totalPartidas || '—'}</div>
            <div className="stat-chip-label">Partidas</div>
          </div>
          <div className="stat-chip blue">
            <div className="stat-chip-value">{archetypeStats?.length || '—'}</div>
            <div className="stat-chip-label">Arquetipos</div>
          </div>
          <div className="stat-chip green">
            <div className="stat-chip-value">{topWR}%</div>
            <div className="stat-chip-label">Mejor WR</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Cargando estadísticas...</span>
        </div>
      )}

      {error && (
        <div className="auth-error" style={{ marginBottom: 20 }}>
          Error al cargar los datos: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Winrate table (colapsable) ── */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body">

              <div
                onClick={() => setTableOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
                  <div className="card-title-icon purple">📊</div>
                  <span className="card-title-text">Meta Global — Winrate por Arquetipo</span>
                  {!tableOpen && displayed.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {displayed.slice(0, 5).map(row => {
                        const wr = Number(row.winrate || 0);
                        return (
                          <span key={row.archetype} style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(255,255,255,.04)',
                            border: '1px solid rgba(255,255,255,.07)',
                            color: wrColor(wr), fontWeight: 600, whiteSpace: 'nowrap',
                          }}>
                            {row.archetype.split(' ')[0]} {wr}%
                          </span>
                        );
                      })}
                      {displayed.length > 5 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 4px', alignSelf: 'center' }}>
                          +{displayed.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                  {tableOpen && (
                    <div className="toggle-chips" onClick={e => e.stopPropagation()}>
                      <button className={`toggle-chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>Todos</button>
                      <button className={`toggle-chip ${filter === 'top8' ? 'on' : ''}`} onClick={() => setFilter('top8')}>Top 8</button>
                    </div>
                  )}
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: 'rgba(108,87,255,.12)',
                    border: '1px solid rgba(108,87,255,.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9d8bff', fontSize: 14, lineHeight: 1,
                    transition: 'transform .25s',
                    transform: tableOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    ▾
                  </div>
                </div>
              </div>

              {tableOpen && (
                <div style={{ marginTop: 16 }}>
                  <div className="mm-table-header" style={{ gridTemplateColumns: '22px minmax(0,1fr) 38px 38px 52px 64px minmax(0,120px)' }}>
                    <span>#</span>
                    <span>ARQUETIPO</span>
                    <span style={{ textAlign: 'center' }}>V</span>
                    <span style={{ textAlign: 'center' }}>D</span>
                    <span style={{ textAlign: 'center' }}>TOTAL</span>
                    <span style={{ textAlign: 'right' }}>WINRATE</span>
                    <span style={{ paddingLeft: 16 }}>BARRA</span>
                  </div>

                  {displayed.length === 0 && (
                    <div className="empty-state">No hay datos de arquetipos todavía.</div>
                  )}

                  {displayed.map((row, i) => {
                    const meta = getMeta(row.archetype, archetypeMap);
                    const wr = Number(row.winrate || 0);
                    return (
                      <Link
                        key={row.archetype}
                        to={`/archetype/${encodeURIComponent(row.archetype)}`}
                        style={{ textDecoration: 'none', display: 'block' }}
                      >
                        <div
                          className={`mm-row anim-row-${Math.min(i + 1, 5)}`}
                          style={{ gridTemplateColumns: '22px minmax(0,1fr) 38px 38px 52px 64px minmax(0,120px)' }}
                        >
                          <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>{i + 1}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <div className={`arch-dot ${meta.dot}`} />
                            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{row.archetype}</span>
                            <span className={`type-badge ${meta.badge}`}>{meta.emoji} {meta.badge}</span>
                          </div>
                          <span style={{ fontSize: 14, color: 'var(--accent-green)', textAlign: 'center', fontWeight: 600 }}>{row.wins}</span>
                          <span style={{ fontSize: 14, color: 'var(--accent-red)', textAlign: 'center', fontWeight: 600 }}>{row.losses}</span>
                          <span style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>{row.total}</span>
                          <span style={{ fontSize: 15, color: wrColor(wr), textAlign: 'right', fontWeight: 700 }}>{wr}%</span>
                          <div className="wr-bar-bg">
                            <div className="wr-bar-fill" style={{ width: `${wr}%`, background: wrColor(wr), animation: 'bar-grow 1s ease both' }} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Matchup matrix ── */}
          {allArchetypes.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <div className="card-title">
                  <div className="card-title-icon blue">⚔</div>
                  <span className="card-title-text">Matchup Matrix Global</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>
                  Winrate de cada arquetipo (filas) contra los rivales (columnas) · Mín. 3 partidas para mostrar dato
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'separate', borderSpacing: 5, tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                      <col style={{ width: 160 }} />
                      {allArchetypes.map(a => <col key={a} />)}
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 400, textAlign: 'left', padding: '8px 10px' }}>↘ / contra →</th>
                        {allArchetypes.map(a => {
                          const m = getMeta(a, archetypeMap);
                          const rgb = colRgb(m.color);
                          return (
                            <th key={a} style={{ padding: '8px 6px', background: `rgba(${rgb},.08)`, borderRadius: 10, border: `1px solid rgba(${rgb},.22)` }}>
                              <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: colText(m.color) }}>{a}</div>
                              <div style={{ fontSize: 10, textAlign: 'center', marginTop: 2, color: 'var(--text-dim)' }}>{m.emoji} {m.badge}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {allArchetypes.map(player => {
                        const meta = getMeta(player, archetypeMap);
                        return (
                          <tr key={player}>
                            <td style={{ padding: '10px 10px', background: 'rgba(255,255,255,.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,.05)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div className={`arch-dot ${meta.dot}`} style={{ width: 7, height: 7 }} />
                                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{player}</span>
                              </div>
                            </td>
                            {allArchetypes.map(opp => {
                              if (player === opp) return (
                                <td key={opp} className="mx-cell neutral" style={{ borderRadius: 10 }}>
                                  <span style={{ fontSize: 18, color: 'var(--text-dim)' }}>—</span>
                                </td>
                              );
                              const cell = matrixLookup[player]?.[opp];
                              if (!cell) return (
                                <td key={opp} className="mx-cell neutral" style={{ borderRadius: 10 }}>
                                  <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>?</span>
                                </td>
                              );
                              const wr = Number(cell.winrate || 0);
                              const cls = wrCellClass(wr);
                              return (
                                <td key={opp} className={`mx-cell ${cls}`} style={{ borderRadius: 10 }}>
                                  <div className="mx-cell-pct">{wr}%</div>
                                  <div className="mx-cell-score">{cell.wins} – {Number(cell.total) - Number(cell.wins)}</div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Código de colores:</span>
                  <span className="type-badge" style={{ background: 'rgba(6,80,55,.22)', color: '#4ddbb0', border: '1px solid rgba(34,196,144,.25)', borderRadius: 20, padding: '3px 12px', fontSize: 11 }}>&gt;55% Favorable</span>
                  <span className="type-badge" style={{ background: 'rgba(25,25,50,.4)', color: '#5a5a80', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '3px 12px', fontSize: 11 }}>45–55% Paridad</span>
                  <span className="type-badge" style={{ background: 'rgba(130,20,20,.22)', color: '#f09090', border: '1px solid rgba(224,85,85,.22)', borderRadius: 20, padding: '3px 12px', fontSize: 11 }}>&lt;45% Desfavorable</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;