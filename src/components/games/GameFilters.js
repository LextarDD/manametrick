import React, { useState } from 'react';

const GameFilters = ({ decks, onFilterChange }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deckId, setDeckId] = useState('');

  const handleChange = (field, value) => {
    const next = {
      dateFrom,
      dateTo,
      deckId,
      [field]: value,
    };
    if (field === 'dateFrom') setDateFrom(value);
    if (field === 'dateTo') setDateTo(value);
    if (field === 'deckId') setDeckId(value);
    onFilterChange(next);
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setDeckId('');
    onFilterChange({ dateFrom: '', dateTo: '', deckId: '' });
  };

  const hasFilters = dateFrom || dateTo || deckId;

  return (
    <div style={styles.container}>
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Mazo</label>
          <select
            value={deckId}
            onChange={(e) => handleChange('deckId', e.target.value)}
            style={styles.select}
          >
            <option value="">Todos los mazos</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
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
  );
};

const styles = {
  container: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '16px 20px',
    marginBottom: '24px',
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.4)',
  },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#e8e0d0',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
  select: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#e8e0d0',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '160px',
  },
  resetBtn: {
    background: 'rgba(255, 80, 80, 0.15)',
    border: '1px solid rgba(255, 80, 80, 0.3)',
    borderRadius: '6px',
    padding: '8px 14px',
    color: '#ff8080',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s',
    alignSelf: 'flex-end',
  },
};

export default GameFilters;
