import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const TOOLTIP_STYLE = {
  background: '#0f1220',
  border: '1px solid rgba(108,87,255,.3)',
  borderRadius: 10,
  color: '#e8e3ff',
  fontSize: 13,
};

export default function ArchetypePage() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  const [stats, setStats]       = useState(null);
  const [matchups, setMatchups] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { data: statsData, error: statsErr } = await supabase
        .from('archetype_stats').select('*').eq('archetype', decodedName).single();
      if (statsErr && statsErr.code !== 'PGRST116') {
        setError('No se pudieron cargar las estadísticas.'); setLoading(false); return;
      }

      const { data: matchupData, error: matchupErr } = await supabase
        .from('matchup_matrix').select('*').eq('player_archetype', decodedName)
        .order('total', { ascending: false });
      if (matchupErr) {
        setError('No se pudieron cargar los matchups.'); setLoading(false); return;
      }

      setStats(statsData || null);
      setMatchups(matchupData || []);
      setLoading(false);
    };
    fetchData();
  }, [decodedName]);

  if (loading) return (
    <div className="page">
      <div className="loading-state" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <span>Cargando arquetipo...</span>
      </div>
    </div>
  );

  if (error || !stats) return (
    <div className="page">
      <div className="auth-error" style={{ marginBottom: 16 }}>
        {error || `No hay datos para el arquetipo "${decodedName}".`}
      </div>
      <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
        ← Volver al inicio
      </Link>
    </div>
  );

  const wr = Number(stats.winrate);
  const pieData = [
    { name: 'Victorias', value: Number(stats.wins) },
    { name: 'Derrotas',  value: Number(stats.losses) },
  ];

  return (
    <div className="page">
      {/* Back */}
      <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
        ← Meta global
      </Link>

      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.5px', margin: 0 }}>
            {decodedName}
          </h1>
          <span style={{
            padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: 14,
            background: wrColor(wr), color: '#07080f',
          }}>
            {wr}% WR
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          {stats.total} partidas registradas · {stats.wins}V / {stats.losses}D
        </p>
      </div>

      {/* Stat chips */}
      <div className="stat-chips" style={{ marginBottom: 20 }}>
        <div className={`stat-chip ${wr >= 55 ? 'green' : wr >= 50 ? 'amber' : 'red'}`}>
          <div className="stat-chip-value">{wr}%</div>
          <div className="stat-chip-label">Winrate</div>
        </div>
        <div className="stat-chip green">
          <div className="stat-chip-value">{stats.wins}</div>
          <div className="stat-chip-label">Victorias</div>
        </div>
        <div className="stat-chip red">
          <div className="stat-chip-value">{stats.losses}</div>
          <div className="stat-chip-label">Derrotas</div>
        </div>
        <div className="stat-chip purple">
          <div className="stat-chip-value">{stats.total}</div>
          <div className="stat-chip-label">Total</div>
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
        {/* Pie chart */}
        <div className="card">
          <div className="card-body">
            <div className="card-title">
              <div className="card-title-icon purple">🥧</div>
              <span className="card-title-text">Distribución W/L</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill="#22c490" />
                  <Cell fill="#e05555" />
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} partidas`, n]} contentStyle={TOOLTIP_STYLE} />
                <Legend
                  formatter={(value) => <span style={{ color: '#9d8bff', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Winrate bar visual */}
        <div className="card">
          <div className="card-body">
            <div className="card-title">
              <div className="card-title-icon green">📈</div>
              <span className="card-title-text">Rendimiento</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
              {[
                { label: 'Winrate global', value: wr, color: wrColor(wr), max: 100 },
                { label: 'Victorias vs total', value: Number(stats.wins), max: Number(stats.total), color: '#22c490', showCount: true },
              ].map(({ label, value, max, color, showCount }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color, fontWeight: 700 }}>
                      {showCount ? `${value} / ${max}` : `${value}%`}
                    </span>
                  </div>
                  <div className="wr-bar-bg" style={{ marginLeft: 0, height: 8 }}>
                    <div
                      className="wr-bar-fill"
                      style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color, animation: 'bar-grow 1s ease both' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Matchups table */}
      <div className="card">
        <div className="card-body">
          <div className="card-title">
            <div className="card-title-icon blue">⚔</div>
            <span className="card-title-text">Matchups</span>
          </div>

          {matchups.length === 0 ? (
            <div className="empty-state">No hay datos de matchups suficientes.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    {['Arquetipo rival', 'V', 'Total', 'Winrate', 'Barra'].map((h, i) => (
                      <th key={h} style={{
                        padding: '6px 10px',
                        color: 'var(--text-dim)',
                        fontWeight: 500,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '.5px',
                        textAlign: i === 0 ? 'left' : i === 4 ? 'left' : 'center',
                        width: i === 4 ? '35%' : undefined,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matchups.map((m, i) => {
                    const mwr = Number(m.winrate);
                    return (
                      <tr
                        key={m.opponent_archetype}
                        className={`anim-row-${Math.min(i + 1, 5)}`}
                        style={{ borderBottom: '1px solid rgba(255,255,255,.03)', transition: 'background .15s', cursor: 'pointer' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '9px 10px' }}>
                          <Link
                            to={`/archetype/${encodeURIComponent(m.opponent_archetype)}`}
                            style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}
                          >
                            {m.opponent_archetype}
                          </Link>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--accent-green)', fontWeight: 600 }}>{m.wins}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{m.total}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: wrColor(mwr) }}>{mwr}%</td>
                        <td style={{ padding: '9px 10px' }}>
                          <div className="wr-bar-bg" style={{ marginLeft: 0 }}>
                            <div
                              className="wr-bar-fill"
                              style={{ width: `${mwr}%`, background: wrColor(mwr), animation: 'bar-grow 1s ease both' }}
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
    </div>
  );
}
