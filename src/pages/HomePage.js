import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useGlobalStats from '../hooks/useGlobalStats';
import useArchetypes from '../hooks/useArchetypes';
import MatchupMatrix from '../components/stats/MatchupMatrix';
import GlobalMatchupDetails from '../components/stats/GlobalMatchupDetails';

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

// Color de fondo/borde por tipo para los chips
const TYPE_CHIP = {
  aggro:    { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.35)',  text: '#fb923c' },
  burn:     { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', text: '#f87171' },
  tribal:   { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   text: '#4ade80' },
  combo:    { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)',  text: '#60a5fa' },
  control:  { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)', text: '#a78bfa' },
  midrange: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)', text: '#a78bfa' },
  tempo:    { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)',  text: '#60a5fa' },
  prison:   { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', text: '#f87171' },
  storm:    { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)',  text: '#60a5fa' },
  ramp:     { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   text: '#4ade80' },
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

const ALL_TYPES = Object.keys(TYPE_META);

const HomePage = () => {
  const { archetypeStats, matchupMatrix, loading, error } = useGlobalStats();
  const { archetypeMap } = useArchetypes();
  const [filter, setFilter] = useState('all');
  const [tableOpen, setTableOpen] = useState(false);
  const [selectedMatchup, setSelectedMatchup] = useState(null);
  const [activeTypes, setActiveTypes] = useState(new Set(ALL_TYPES));
  const [minRounds, setMinRounds] = useState(null); // null = sin inicializar

  // Calcular la media de rondas para el valor inicial
  const avgRounds = useMemo(() => {
    if (!archetypeStats || archetypeStats.length === 0) return 1;
    const avg = archetypeStats.reduce((s, a) => s + Number(a.total || 0), 0) / archetypeStats.length;
    return Math.max(1, Math.round(avg));
  }, [archetypeStats]);

  // Inicializar minRounds con la media cuando llegan los datos
  const effectiveMin = minRounds === null ? avgRounds : minRounds;

  const toggleType = (type) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) { if (next.size > 1) next.delete(type); }
      else next.add(type);
      return next;
    });
  };

  const allTypesActive = activeTypes.size === ALL_TYPES.length;
  const toggleAll = () => {
    if (allTypesActive) setActiveTypes(new Set([ALL_TYPES[0]]));
    else setActiveTypes(new Set(ALL_TYPES));
  };

  // Lista filtrada por tipo y mínimo de rondas
  const filteredStats = useMemo(() => {
    if (!archetypeStats) return [];
    return archetypeStats.filter(a => {
      const type = archetypeMap[a.archetype] || 'midrange';
      return activeTypes.has(type) && Number(a.total || 0) >= effectiveMin;
    });
  }, [archetypeStats, archetypeMap, activeTypes, effectiveMin]);

  const displayed = filter === 'top8'
    ? [...filteredStats].sort((a, b) => b.winrate - a.winrate).slice(0, 8)
    : [...filteredStats].sort((a, b) => b.winrate - a.winrate);

  const archetypeList = (archetypeStats || []).map(a => a.archetype);
  const totalPartidas = (archetypeStats || []).reduce((sum, a) => sum + Number(a.total || 0), 0) / 2 | 0;
  const topWR = displayed.length ? Math.max(...displayed.map(a => Number(a.winrate || 0))).toFixed(1) : '—';

  const stepMin = (delta) => setMinRounds(Math.max(1, effectiveMin + delta));

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

              {/* Cabecera colapsable */}
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
                            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
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
                    background: 'rgba(108,87,255,.12)', border: '1px solid rgba(108,87,255,.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9d8bff', fontSize: 14, lineHeight: 1,
                    transition: 'transform .25s',
                    transform: tableOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▾</div>
                </div>
              </div>

              {tableOpen && (
                <div style={{ marginTop: 14 }}>

                  {/* ── Barra de filtros ── */}
                  <div onClick={e => e.stopPropagation()} style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    padding: '10px 12px', marginBottom: 14,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                  }}>
                    {/* Chips de tipo */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                      {/* Botón "Todos" */}
                      <button
                        onClick={toggleAll}
                        style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', border: '1px solid',
                          transition: 'all 0.15s',
                          background: allTypesActive ? 'rgba(108,87,255,0.18)' : 'rgba(255,255,255,0.04)',
                          borderColor: allTypesActive ? 'rgba(108,87,255,0.5)' : 'rgba(255,255,255,0.1)',
                          color: allTypesActive ? '#a78bfa' : '#555',
                        }}
                      >
                        Todos
                      </button>
                      {ALL_TYPES.map(type => {
                        const active = activeTypes.has(type);
                        const chip = TYPE_CHIP[type] || TYPE_CHIP.midrange;
                        const meta = TYPE_META[type];
                        return (
                          <button
                            key={type}
                            onClick={() => toggleType(type)}
                            style={{
                              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                              background: active ? chip.bg : 'rgba(255,255,255,0.03)',
                              borderColor: active ? chip.border : 'rgba(255,255,255,0.08)',
                              color: active ? chip.text : '#444',
                              opacity: active ? 1 : 0.5,
                            }}
                          >
                            {meta.emoji} {type}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mínimo de rondas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>Mín. rondas</span>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, overflow: 'hidden' }}>
                        <button
                          onClick={() => stepMin(-1)}
                          style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
                        >−</button>
                        <span style={{
                          padding: '3px 10px', fontSize: 12, fontWeight: 700,
                          color: '#c8c0ff', background: 'rgba(108,87,255,0.1)',
                          minWidth: 28, textAlign: 'center',
                        }}>
                          {effectiveMin}
                        </span>
                        <button
                          onClick={() => stepMin(1)}
                          style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
                        >+</button>
                      </div>
                      {minRounds !== null && minRounds !== avgRounds && (
                        <button
                          onClick={() => setMinRounds(null)}
                          title="Restablecer al valor por defecto"
                          style={{ fontSize: 10, color: '#555', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                        >↺</button>
                      )}
                    </div>
                  </div>

                  {/* ── Tabla ── */}
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
                    <div className="empty-state">No hay arquetipos que cumplan los filtros.</div>
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
          {archetypeList.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <div className="card-title">
                  <div className="card-title-icon blue">⚔</div>
                  <span className="card-title-text">Matchup Matrix Global</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>
                  Winrate de cada arquetipo (filas) contra los rivales (columnas) · Mín. 3 partidas para mostrar dato
                </p>
                <MatchupMatrix
                  matrix={matchupMatrix}
                  archetypeList={archetypeList}
                  onSelectArchetype={(playerArch, oppArch) => setSelectedMatchup({ playerArch, oppArch })}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal matchup global ── */}
      {selectedMatchup && (
        <GlobalMatchupDetails
          playerArch={selectedMatchup.playerArch}
          oppArch={selectedMatchup.oppArch}
          matchupMatrix={matchupMatrix}
          onClose={() => setSelectedMatchup(null)}
        />
      )}
    </div>
  );
};

export default HomePage;