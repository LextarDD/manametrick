import React, { useMemo } from 'react';
import { useAuth } from '../AuthContext';
import useGames from '../hooks/useGames';
import MyMatchupMatrix from '../components/matchup/MyMatchupMatrix';

const MyMatchupPage = () => {
  const { user } = useAuth();
  const { games, loading, error } = useGames(user?.id);

  // Stats por rondas (1 game = 1 ronda)
  const stats = useMemo(() => {
    const wins   = games.filter(g => g.result === 'win').length;
    const losses = games.filter(g => g.result === 'loss').length;
    const draws  = games.filter(g => g.result === 'draw').length;
    const total  = games.length;
    const wr = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 1000) / 10 : null;
    return { wins, losses, draws, total, wr };
  }, [games]);

  return (
    <div className="page-wide" style={{ maxWidth: 'none', padding: '32px 24px' }}>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Mi Matriz de <span className="gradient-text">Matchups</span></h1>
          <p className="page-subtitle">Rendimiento personal cruzado entre todos tus arquetipos registrados</p>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Cargando partidas...</span>
        </div>
      )}

      {error && (
        <div className="auth-error" style={{ marginBottom: 20 }}>
          Error al cargar las partidas: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {games.length > 0 && (
            <div className="stat-chips anim-fade-up" style={{ marginBottom: 20 }}>
              <div className="stat-chip purple">
                <div className="stat-chip-value">{stats.total}</div>
                <div className="stat-chip-label">Rondas totales</div>
              </div>
              <div className="stat-chip green">
                <div className="stat-chip-value">{stats.wins}</div>
                <div className="stat-chip-label">Victorias</div>
              </div>
              <div className="stat-chip red">
                <div className="stat-chip-value">{stats.losses}</div>
                <div className="stat-chip-label">Derrotas</div>
              </div>
              {stats.draws > 0 && (
                <div className="stat-chip blue">
                  <div className="stat-chip-value">{stats.draws}</div>
                  <div className="stat-chip-label">Empates</div>
                </div>
              )}
              {stats.wr !== null && (
                <div className={`stat-chip ${stats.wr >= 50 ? 'green' : 'red'}`}>
                  <div className="stat-chip-value">{stats.wr}%</div>
                  <div className="stat-chip-label">Winrate global</div>
                </div>
              )}
            </div>
          )}

          {games.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-body" style={{ padding: '12px 18px' }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Celdas = tu winrate como <strong style={{ color: '#9d8bff' }}>fila</strong> contra <strong style={{ color: '#9d8bff' }}>columna</strong></span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                      { label: '≥60%',   style: {} },
                      { label: '50–60%', style: { background: 'rgba(6,80,55,.16)', borderColor: 'rgba(34,196,144,.18)' } },
                      { label: '40–50%', style: { background: 'rgba(240,160,48,.12)', borderColor: 'rgba(240,160,48,.25)', color: '#c8922a' } },
                      { label: '<40%',   style: { background: 'rgba(239,68,68,.12)', borderColor: 'rgba(239,68,68,.25)' } },
                    ].map(({ label, style: s }) => (
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 14, height: 14, display: 'inline-block', borderRadius: 3, border: '1px solid rgba(255,255,255,.1)', ...s }} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                      </span>
                    ))}
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 11 }}>Haz clic en una celda para ver el detalle</span>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ width: '100%' }}>
            <div className="card-body" style={{ padding: '16px 12px' }}>
              <div className="card-title">
                <div className="card-title-icon blue">⚔</div>
                <span className="card-title-text">Matriz personal de matchups</span>
              </div>
              <MyMatchupMatrix games={games} user={user} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyMatchupPage;