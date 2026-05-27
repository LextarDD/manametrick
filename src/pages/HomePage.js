import React from 'react';
import useGlobalStats from '../hooks/useGlobalStats';
import GlobalStats from '../components/stats/GlobalStats';

const HomePage = () => {
  const { archetypeStats, matchupMatrix, loading, error } = useGlobalStats();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '500', margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
          Meta Pauper — Estadísticas globales
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
          Datos en tiempo real de la comunidad. Winrates calculados sobre todas las partidas registradas.
          <br />
          Inicia sesión para registrar tus propias partidas y ver tus estadísticas personales.
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Cargando estadísticas...</p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-md)',
          background: 'var(--color-background-danger)',
          border: '0.5px solid var(--color-border-danger)',
          color: 'var(--color-text-danger)',
          fontSize: '14px',
          marginBottom: '1.5rem',
        }}>
          Error al cargar los datos: {error}
        </div>
      )}

      {!loading && !error && (
        <GlobalStats
          archetypeStats={archetypeStats}
          matchupMatrix={matchupMatrix}
        />
      )}

      <div style={{
        marginTop: '3rem',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--border-radius-lg)',
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Código de colores', items: [
              { color: '#e6f4ea', text: '#1e6b3a', border: '#a8d5b5', label: '≥60% Favorable' },
              { color: '#fafafa', text: '#555', border: '#e0e0e0', label: '47–53% Paridad' },
              { color: '#fef0f0', text: '#b91c1c', border: '#fca5a5', label: '<40% Desfavorable' },
            ]}
          ].map(group => (
            <div key={group.label}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>{group.label}:</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {group.items.map(item => (
                  <span
                    key={item.label}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--border-radius-md)',
                      background: item.color,
                      color: item.text,
                      border: `0.5px solid ${item.border}`,
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
