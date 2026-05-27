// src/components/stats/MyStats.js
import React, { useState, useMemo } from 'react';
import MyArchetypeDetails from './MyArchetypeDetails';

const SORT_OPTIONS = [
  { value: 'winrate_desc', label: 'Winrate ↓' },
  { value: 'winrate_asc', label: 'Winrate ↑' },
  { value: 'games_desc', label: 'Más partidas' },
  { value: 'games_asc', label: 'Menos partidas' },
  { value: 'name_asc', label: 'Nombre A-Z' },
];

function computeStats(games) {
  const map = {};
  for (const g of games) {
    const key = g.archetype || 'Sin arquetipo';
    if (!map[key]) map[key] = { wins: 0, losses: 0 };
    if (g.result === 'win') map[key].wins++;
    else map[key].losses++;
  }
  return Object.entries(map).map(([name, { wins, losses }]) => {
    const total = wins + losses;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { name, wins, losses, total, winrate };
  });
}

function computeDeckStats(games, decks) {
  const map = {};
  for (const g of games) {
    const key = g.deck_id;
    if (!key) continue;
    if (!map[key]) {
      const deck = decks.find(d => d.id === key);
      map[key] = { wins: 0, losses: 0, name: g.deck_name || (deck?.name ?? 'Mazo desconocido'), deckId: key };
    }
    if (g.result === 'win') map[key].wins++;
    else map[key].losses++;
  }
  return Object.values(map).map(({ wins, losses, name, deckId }) => {
    const total = wins + losses;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { name, wins, losses, total, winrate, deckId };
  });
}

function sortStats(stats, sortBy) {
  return [...stats].sort((a, b) => {
    switch (sortBy) {
      case 'winrate_desc': return b.winrate - a.winrate;
      case 'winrate_asc': return a.winrate - b.winrate;
      case 'games_desc': return b.total - a.total;
      case 'games_asc': return a.total - b.total;
      case 'name_asc': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });
}

function WinrateBar({ winrate }) {
  const color = winrate >= 55 ? '#4ade80' : winrate >= 45 ? '#facc15' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1,
        height: 8,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${winrate}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{
        fontFamily: 'monospace',
        fontSize: 13,
        color,
        fontWeight: 700,
        minWidth: 38,
        textAlign: 'right',
      }}>{winrate}%</span>
    </div>
  );
}

function StatRow({ item, onClick, index }) {
  const isGood = item.winrate >= 55;
  const isBad = item.winrate < 45;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 80px 180px',
        gap: 12,
        alignItems: 'center',
        padding: '14px 20px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        animationDelay: `${index * 30}ms`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
    >
      <span style={{
        fontWeight: 600,
        fontSize: 14,
        color: '#e2e8f0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{item.name}</span>

      <span style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        fontFamily: 'monospace',
      }}>
        <span style={{ color: '#4ade80' }}>{item.wins}W</span>
        {' / '}
        <span style={{ color: '#f87171' }}>{item.losses}L</span>
      </span>

      <span style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
        textAlign: 'center',
        fontFamily: 'monospace',
      }}>{item.total} gg</span>

      <WinrateBar winrate={item.winrate} />
    </div>
  );
}

export default function MyStats({ games, decks, archetypes, onCreateTournament, user }) {
  const [tab, setTab] = useState('archetypes'); // 'archetypes' | 'decks'
  const [sortBy, setSortBy] = useState('winrate_desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null); // { type, name, deckId? }

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const date = new Date(g.created_at);
      if (dateFrom && date < new Date(dateFrom)) return false;
      if (dateTo && date > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [games, dateFrom, dateTo]);

  const archetypeStats = useMemo(() => sortStats(computeStats(filteredGames), sortBy), [filteredGames, sortBy]);
  const deckStats = useMemo(() => sortStats(computeDeckStats(filteredGames, decks), sortBy), [filteredGames, decks, sortBy]);

  const totalGames = filteredGames.length;
  const totalWins = filteredGames.filter(g => g.result === 'win').length;
  const globalWinrate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  const handleSelectArchetype = (name) => setSelected({ type: 'archetype', name });
  const handleSelectDeck = (item) => setSelected({ type: 'deck', name: item.name, deckId: item.deckId });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header + global summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Mis Estadísticas</h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            {totalGames} partidas · {totalWins}W / {totalGames - totalWins}L · {globalWinrate}% global
          </p>
        </div>
        {onCreateTournament && (
          <button
            onClick={onCreateTournament}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            + Nuevo Torneo
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Filtros
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={inputStyle}
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{
              padding: '5px 12px',
              background: 'rgba(248,113,113,0.15)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tab switcher + sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: 4,
          gap: 2,
        }}>
          {[
            { value: 'archetypes', label: 'Por arquetipo' },
            { value: 'decks', label: 'Por mazo' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTab(opt.value)}
              style={{
                padding: '8px 18px',
                background: tab === opt.value ? 'rgba(99,102,241,0.7)' : 'transparent',
                color: tab === opt.value ? '#fff' : 'rgba(255,255,255,0.5)',
                border: 'none',
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Ordenar:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={inputStyle}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats list */}
      {tab === 'archetypes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {archetypeStats.length === 0 ? (
            <Empty text="No hay partidas registradas con arquetipo." />
          ) : (
            <>
              <ListHeader />
              {archetypeStats.map((item, i) => (
                <StatRow key={item.name} item={item} index={i} onClick={() => handleSelectArchetype(item.name)} />
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'decks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {deckStats.length === 0 ? (
            <Empty text="No hay partidas registradas con mazos." />
          ) : (
            <>
              <ListHeader />
              {deckStats.map((item, i) => (
                <StatRow key={item.deckId} item={item} index={i} onClick={() => handleSelectDeck(item)} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <MyArchetypeDetails
          user={user}
          archetype={selected.type === 'archetype' ? selected.name : undefined}
          deckName={selected.type === 'deck' ? selected.name : undefined}
          games={filteredGames}
          decks={decks}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ListHeader() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 80px 80px 180px',
      gap: 12,
      padding: '6px 20px',
    }}>
      {['Nombre', 'W / L', 'Partidas', 'Winrate'].map(h => (
        <span key={h} style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'rgba(255,255,255,0.3)',
          textAlign: h === 'Nombre' ? 'left' : 'center',
        }}>{h}</span>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: 'rgba(255,255,255,0.3)',
      fontSize: 14,
    }}>{text}</div>
  );
}

const inputStyle = {
  padding: '6px 10px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
};
