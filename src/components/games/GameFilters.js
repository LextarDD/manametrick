import React, { useState } from 'react';

const GameFilters = ({ decks, onFilterChange }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deckId, setDeckId] = useState('');

  const handleChange = (field, value) => {
    const next = { dateFrom, dateTo, deckId, [field]: value };
    if (field === 'dateFrom') setDateFrom(value);
    if (field === 'dateTo')   setDateTo(value);
    if (field === 'deckId')   setDeckId(value);
    onFilterChange(next);
  };

  const handleReset = () => {
    setDateFrom(''); setDateTo(''); setDeckId('');
    onFilterChange({ dateFrom: '', dateTo: '', deckId: '' });
  };

  const hasFilters = dateFrom || dateTo || deckId;

  return (
    <>
      {/* Inyectar estilos para corregir el select en todos los navegadores/OS */}
      <style>{`
        .mm-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: rgba(255,255,255,0.06) !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236a6a9a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 10px center !important;
          padding-right: 30px !important;
          color: #e8e0d0 !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          outline: none !important;
          cursor: pointer !important;
          min-width: 160px;
          padding-top: 8px;
          padding-bottom: 8px;
          padding-left: 12px;
        }
        .mm-select option {
          background-color: #0f1220 !important;
          color: #e8e0d0 !important;
        }
        .mm-select:focus {
          border-color: rgba(108,87,255,.4) !important;
          box-shadow: 0 0 0 2px rgba(108,87,255,.15) !important;
        }
        .mm-date-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          padding: 8px 12px;
          color: #e8e0d0;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          color-scheme: dark;
        }
        .mm-date-input:focus {
          border-color: rgba(108,87,255,.4);
          box-shadow: 0 0 0 2px rgba(108,87,255,.15);
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => handleChange('dateFrom', e.target.value)}
              className="mm-date-input"
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label}>Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => handleChange('dateTo', e.target.value)}
              className="mm-date-input"
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label}>Mazo</label>
            <select
              value={deckId}
              onChange={e => handleChange('deckId', e.target.value)}
              className="mm-select"
            >
              <option value="">Todos los mazos</option>
              {decks.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button onClick={handleReset} style={styles.resetBtn}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '16px 20px',
  },
  filterRow: { display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' },
  resetBtn: {
    background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)',
    borderRadius: 6, padding: '8px 14px', color: '#ff8080',
    fontSize: 12, cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-end',
  },
};

export default GameFilters;