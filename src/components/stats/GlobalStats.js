// src/components/stats/GlobalStats.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useGlobalStats from '../../hooks/useGlobalStats';
import ArchetypeDetails from './ArchetypeDetails';
import MatchupMatrix from './MatchupMatrix';

export default function GlobalStats() {
  const { archetypeStats, matchupMatrix, loading, error } = useGlobalStats();
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [showTop8Only, setShowTop8Only] = useState(false);

  // archetypeList derivado de archetypeStats (ya viene ordenado por total desc)
  const archetypeList = archetypeStats.map(a => a.archetype);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Cargando estadísticas globales…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorBox}>
        <p style={styles.errorText}>Error al cargar estadísticas: {error}</p>
      </div>
    );
  }

  const top8 = [...archetypeStats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const top8Names = top8.map((a) => a.archetype);

  const displayList = showTop8Only ? top8 : archetypeStats;

  const winrateColor = (wr) => {
    const w = Number(wr);
    if (w >= 55) return '#4ade80';
    if (w >= 50) return '#facc15';
    return '#f87171';
  };

  return (
    <div style={styles.wrapper}>
      {/* ── Tabla de arquetipos ── */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Meta Global — Winrate por Arquetipo</h2>
          <div style={styles.toggleGroup}>
            <button
              style={{ ...styles.toggleBtn, ...(showTop8Only ? {} : styles.toggleActive) }}
              onClick={() => setShowTop8Only(false)}
            >
              Todos
            </button>
            <button
              style={{ ...styles.toggleBtn, ...(showTop8Only ? styles.toggleActive : {}) }}
              onClick={() => setShowTop8Only(true)}
            >
              Top 8
            </button>
          </div>
        </div>

        {archetypeStats.length === 0 ? (
          <p style={styles.emptyText}>Aún no hay partidas registradas en la comunidad.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Arquetipo</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>W</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>L</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Total</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Winrate</th>
                  <th style={{ ...styles.th, width: '25%' }}>Barra</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((a, i) => (
                  <tr
                    key={a.archetype}
                    style={styles.tr}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...styles.td, color: '#64748b', width: 36 }}>{i + 1}</td>
                    <td style={styles.td}>
                      <Link
                        to={`/archetype/${encodeURIComponent(a.archetype)}`}
                        style={styles.archetypeLink}
                      >
                        {a.archetype}
                      </Link>
                      <button
                        style={styles.detailBtn}
                        onClick={() => setSelectedArchetype(a.archetype)}
                        title="Ver detalle en modal"
                      >
                        ↗
                      </button>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#4ade80' }}>{a.wins}</td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#f87171' }}>{a.losses}</td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>{a.total}</td>
                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: winrateColor(a.winrate) }}>
                      {a.winrate}%
                    </td>
                    <td style={styles.td}>
                      <div style={styles.barBg}>
                        <div style={{ ...styles.barFill, width: `${a.winrate}%`, background: winrateColor(a.winrate) }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Matchup Matrix ── */}
      {archetypeList.length > 1 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Matchup Matrix Global</h2>
          <p style={styles.matrixNote}>
            Winrate de cada arquetipo (filas) contra los rivales (columnas). Mínimo 3 partidas para mostrar dato.
          </p>
          <div style={styles.matrixScroll}>
            <MatchupMatrix
              matrix={matchupMatrix}
              archetypeList={archetypeList}
              onSelectArchetype={setSelectedArchetype}
            />
          </div>
        </section>
      )}

      {/* ── Modal de detalle ── */}
      {selectedArchetype && (
        <ArchetypeDetails
          archetype={selectedArchetype}
          allStats={archetypeStats}
          matchupMatrix={matchupMatrix}
          onClose={() => setSelectedArchetype(null)}
          filterTop8Only={showTop8Only}
          top8Names={top8Names}
        />
      )}
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', margin: 0, letterSpacing: '-0.01em' },
  toggleGroup: { display: 'flex', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' },
  toggleBtn: { padding: '0.35rem 0.9rem', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' },
  toggleActive: { background: '#3b82f6', color: '#fff' },
  tableWrapper: { overflowX: 'auto', borderRadius: '10px', border: '1px solid #1e293b' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' },
  th: { textAlign: 'left', padding: '0.65rem 0.9rem', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#0f172a', borderBottom: '1px solid #1e293b' },
  tr: { borderBottom: '1px solid #1e293b', transition: 'background 0.1s', cursor: 'default' },
  td: { padding: '0.65rem 0.9rem', color: '#cbd5e1', verticalAlign: 'middle' },
  archetypeLink: { color: '#7dd3fc', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', marginRight: '0.4rem', transition: 'color 0.15s' },
  detailBtn: { background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.75rem', padding: '0 0.2rem', verticalAlign: 'middle', transition: 'color 0.15s', lineHeight: 1 },
  barBg: { background: '#0f172a', borderRadius: '4px', height: 7, width: '100%', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' },
  matrixNote: { color: '#64748b', fontSize: '0.8rem', margin: 0 },
  matrixScroll: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' },
  spinner: { width: 32, height: 32, borderRadius: '50%', border: '3px solid #334155', borderTopColor: '#7dd3fc', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#64748b', fontSize: '0.85rem' },
  errorBox: { background: '#1e293b', border: '1px solid #ef4444', borderRadius: '8px', padding: '1rem 1.5rem' },
  errorText: { color: '#f87171', margin: 0, fontSize: '0.9rem' },
  emptyText: { color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' },
};