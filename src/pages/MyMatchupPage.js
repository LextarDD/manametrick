// src/pages/MyMatchupPage.js
import React from 'react';
import { useAuth } from '../AuthContext';
import useGames from '../hooks/useGames';
import MyMatchupMatrix from '../components/matchup/MyMatchupMatrix';

const MyMatchupPage = () => {
  const { user } = useAuth();
  const { games, loading, error } = useGames(user?.id);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1e',
      color: '#f1f5f9',
      fontFamily: "'Crimson Pro', Georgia, serif",
    }}>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%)',
        borderBottom: '1px solid #1e293b',
        padding: '40px 24px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '200px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative' }}>
          <div style={{
            fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#6366f1', marginBottom: '10px',
          }}>
            ⚔ Análisis personal
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 700,
            color: '#f1f5f9',
            lineHeight: 1.1,
          }}>
            Mi Matriz de Matchups
          </h1>
          <p style={{
            margin: '12px 0 0',
            color: '#64748b',
            fontSize: '1rem',
            maxWidth: '480px',
          }}>
            Rendimiento personal cruzado entre todos tus arquetipos registrados.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
            <div style={{
              width: '32px', height: '32px', border: '2px solid #334155',
              borderTopColor: '#6366f1', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Cargando partidas…
          </div>
        )}

        {error && (
          <div style={{
            background: '#7f1d1d', border: '1px solid #991b1b',
            borderRadius: '10px', padding: '16px 20px',
            color: '#fca5a5', fontSize: '0.9rem',
          }}>
            Error al cargar las partidas: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {games.length > 0 && (
              <div style={{
                display: 'flex', gap: '16px', flexWrap: 'wrap',
                marginBottom: '28px',
              }}>
                {[
                  { label: 'Partidas totales', value: games.length, color: '#94a3b8' },
                  { label: 'Victorias', value: games.filter(g => g.result === 'win').length, color: '#4ade80' },
                  { label: 'Derrotas', value: games.filter(g => g.result === 'loss').length, color: '#f87171' },
                  {
                    label: 'Winrate global',
                    value: `${Math.round(games.filter(g => g.result === 'win').length / games.length * 1000) / 10}%`,
                    color: games.filter(g => g.result === 'win').length / games.length >= 0.5 ? '#4ade80' : '#f87171',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '14px 20px',
                    flex: '1',
                    minWidth: '100px',
                  }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {games.length > 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '10px 16px',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#64748b',
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                <span>Celdas = tu winrate como <strong style={{ color: '#94a3b8' }}>fila</strong> contra <strong style={{ color: '#94a3b8' }}>columna</strong></span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {[
                    { color: '#166534', bg: '#14532d', label: '≥60%' },
                    { color: '#15803d', bg: '#166534', label: '50–60%' },
                    { color: '#f97316', bg: '#431407', label: '40–50%' },
                    { color: '#ef4444', bg: '#7f1d1d', label: '<40%' },
                  ].map(({ color, bg, label }) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '12px', height: '12px', background: bg, border: `1px solid ${color}`, borderRadius: '3px', display: 'inline-block' }} />
                      {label}
                    </span>
                  ))}
                </div>
                <span style={{ marginLeft: 'auto', color: '#475569' }}>Haz clic en una celda para ver el detalle</span>
              </div>
            )}

            <MyMatchupMatrix games={games} user={user} />
          </>
        )}
      </div>
    </div>
  );
};

export default MyMatchupPage;
