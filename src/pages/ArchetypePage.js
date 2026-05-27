// src/pages/ArchetypePage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = {
  win: '#4ade80',
  loss: '#f87171',
};

const MATCHUP_COLORS = (wr) => {
  if (wr >= 60) return '#4ade80';
  if (wr >= 50) return '#86efac';
  if (wr >= 40) return '#fca5a5';
  return '#f87171';
};

export default function ArchetypePage() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  const [stats, setStats] = useState(null);
  const [matchups, setMatchups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Stats del arquetipo desde la vista archetype_stats
      const { data: statsData, error: statsError } = await supabase
        .from('archetype_stats')
        .select('*')
        .eq('archetype', decodedName)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        setError('No se pudieron cargar las estadísticas.');
        setLoading(false);
        return;
      }

      // Matchups desde la vista matchup_matrix
      const { data: matchupData, error: matchupError } = await supabase
        .from('matchup_matrix')
        .select('*')
        .eq('player_archetype', decodedName)
        .order('total', { ascending: false });

      if (matchupError) {
        setError('No se pudieron cargar los matchups.');
        setLoading(false);
        return;
      }

      setStats(statsData || null);
      setMatchups(matchupData || []);
      setLoading(false);
    };

    fetchData();
  }, [decodedName]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Cargando arquetipo…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error}</p>
        <Link to="/" style={styles.backLink}>← Volver al inicio</Link>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>No hay datos para el arquetipo <strong>{decodedName}</strong>.</p>
        <Link to="/" style={styles.backLink}>← Volver al inicio</Link>
      </div>
    );
  }

  const pieData = [
    { name: 'Victorias', value: Number(stats.wins) },
    { name: 'Derrotas', value: Number(stats.losses) },
  ];

  const winrate = Number(stats.winrate);
  const winrateColor =
    winrate >= 55 ? '#4ade80' :
    winrate >= 50 ? '#facc15' :
    '#f87171';

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/" style={styles.backLink}>← Meta global</Link>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>{decodedName}</h1>
          <span style={{ ...styles.winrateBadge, background: winrateColor }}>
            {winrate}% WR
          </span>
        </div>
        <p style={styles.subtitle}>
          {stats.total} partidas registradas · {stats.wins}W / {stats.losses}L
        </p>
      </div>

      <div style={styles.grid}>
        {/* Gráfico de tarta */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Distribución W/L</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                <Cell fill={COLORS.win} />
                <Cell fill={COLORS.loss} />
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} partidas`, name]}
                contentStyle={styles.tooltipStyle}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats resumen */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Resumen</h2>
          <div style={styles.statGrid}>
            <StatBox label="Winrate" value={`${winrate}%`} color={winrateColor} />
            <StatBox label="Victorias" value={stats.wins} color="#4ade80" />
            <StatBox label="Derrotas" value={stats.losses} color="#f87171" />
            <StatBox label="Total" value={stats.total} color="#94a3b8" />
          </div>
        </div>
      </div>

      {/* Matchups */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Matchups</h2>
        {matchups.length === 0 ? (
          <p style={styles.emptyText}>No hay datos de matchups suficientes.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Arquetipo rival</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>W</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Total</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Winrate</th>
                  <th style={{ ...styles.th, textAlign: 'left', width: '35%' }}>Barra</th>
                </tr>
              </thead>
              <tbody>
                {matchups.map((m) => {
                  const wr = Number(m.winrate);
                  return (
                    <tr key={m.opponent_archetype} style={styles.tr}>
                      <td style={styles.td}>
                        <Link
                          to={`/archetype/${encodeURIComponent(m.opponent_archetype)}`}
                          style={styles.archetypeLink}
                        >
                          {m.opponent_archetype}
                        </Link>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{m.wins}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{m.total}</td>
                      <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: MATCHUP_COLORS(wr) }}>
                        {wr}%
                      </td>
                      <td style={styles.td}>
                        <div style={styles.barBg}>
                          <div
                            style={{
                              ...styles.barFill,
                              width: `${wr}%`,
                              background: MATCHUP_COLORS(wr),
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={styles.statBox}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  backLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    letterSpacing: '0.02em',
    display: 'inline-block',
    marginBottom: '0.25rem',
    transition: 'color 0.15s',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    margin: 0,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  winrateBadge: {
    padding: '0.3rem 0.8rem',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '1rem',
    color: '#0f172a',
  },
  subtitle: {
    color: '#64748b',
    margin: 0,
    fontSize: '0.9rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '0 0 1rem 0',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
    background: '#0f172a',
    borderRadius: '8px',
    padding: '1rem 0.5rem',
  },
  statValue: {
    fontSize: '1.8rem',
    fontWeight: 800,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.6rem 0.8rem',
    color: '#64748b',
    fontWeight: 600,
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid #334155',
  },
  tr: {
    borderBottom: '1px solid #1e293b',
    transition: 'background 0.12s',
  },
  td: {
    padding: '0.65rem 0.8rem',
    color: '#cbd5e1',
    verticalAlign: 'middle',
  },
  archetypeLink: {
    color: '#7dd3fc',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'color 0.15s',
  },
  barBg: {
    background: '#0f172a',
    borderRadius: '4px',
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    gap: '1rem',
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '3px solid #334155',
    borderTopColor: '#7dd3fc',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '0.9rem',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    gap: '1rem',
  },
  errorText: {
    color: '#f87171',
    fontSize: '1rem',
  },
  tooltipStyle: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '0.85rem',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    padding: '2rem 0',
    fontSize: '0.9rem',
  },
};
