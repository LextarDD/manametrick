import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../shared/Modal';

const COLORS = ['#4ade80', '#f87171'];

// Cache compartido con DeckViewer
const cardCache = {};

async function fetchCard(name) {
  if (cardCache[name] !== undefined) return cardCache[name];
  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
    if (!res.ok) { cardCache[name] = null; return null; }
    const data = await res.json();
    cardCache[name] = {
      img: data?.image_uris?.normal || data?.card_faces?.[0]?.image_uris?.normal || null,
      type: data?.type_line || data?.card_faces?.[0]?.type_line || '',
    };
    return cardCache[name];
  } catch { cardCache[name] = null; return null; }
}

// Tierras siempre van a Tierras, aunque sean artefactos o criaturas también
function classifyType(typeLine = '') {
  const t = typeLine.toLowerCase();
  if (t.includes('land'))        return 'Tierras';
  if (t.includes('creature'))    return 'Criaturas';
  if (t.includes('sorcery'))     return 'Conjuros';
  if (t.includes('instant'))     return 'Instantáneos';
  if (t.includes('artifact'))    return 'Artefactos';
  if (t.includes('enchantment')) return 'Encantamientos';
  return 'Otros';
}

const TYPE_ORDER = ['Criaturas', 'Conjuros', 'Instantáneos', 'Artefactos', 'Encantamientos', 'Tierras', 'Otros'];

function parseLine(line) {
  const m = line.trim().match(/^(\d+)\s+(.+)$/);
  if (!m) return null;
  return { qty: parseInt(m[1], 10), name: m[2].trim() };
}

// ── Fila de carta con imagen flotante al hover ─────────────────────────────
function CardRow({ qty, name }) {
  const [cardData, setCardData] = useState(cardCache[name] || null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!cardData) fetchCard(name).then(d => setCardData(d));
  }, [name]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '4px 10px', borderRadius: 5,
        background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        cursor: 'default', transition: 'background 0.1s',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>
        {qty}×
      </span>
      <span style={{ fontSize: 13, color: '#cbd5e1', flex: 1 }}>{name}</span>

      {hovered && cardData?.img && (
        <div style={{
          position: 'fixed',
          left: pos.x + 18,
          top: Math.min(pos.y - 60, window.innerHeight - 310),
          zIndex: 9999, pointerEvents: 'none',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.85))',
        }}>
          <img src={cardData.img} alt={name} style={{ width: 180, borderRadius: 10, display: 'block' }} />
        </div>
      )}
    </div>
  );
}

// ── Sección por tipo ───────────────────────────────────────────────────────
function CardSection({ label, cards }) {
  if (!cards || cards.length === 0) return null;
  const total = cards.reduce((s, c) => s + c.qty, 0);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 10px 5px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b' }}>
          {label}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '1px 6px' }}>
          {total}
        </span>
      </div>
      {cards.map(({ qty, name }) => <CardRow key={name} qty={qty} name={name} />)}
    </div>
  );
}

// ── Lista completa del mazo ────────────────────────────────────────────────
function DeckList({ deck }) {
  const [showSide, setShowSide] = useState(false);
  const [cardTypes, setCardTypes] = useState({});
  const [loading, setLoading] = useState(true);

  const isSep = (l) => /^sideboard[:\s]*$/i.test(l.trim());

  const mainCards = useMemo(() =>
    (deck.mainboard || [])
      .filter(l => l.trim() && !isSep(l))
      .map(parseLine).filter(Boolean),
    [deck.mainboard]
  );
  const sideCards = useMemo(() =>
    (deck.sideboard || [])
      .filter(l => l.trim() && !isSep(l))
      .map(parseLine).filter(Boolean),
    [deck.sideboard]
  );

  const allNames = useMemo(() =>
    [...new Set([...mainCards, ...sideCards].map(c => c.name))],
    [mainCards, sideCards]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const BATCH = 6;
      for (let i = 0; i < allNames.length; i += BATCH) {
        await Promise.all(allNames.slice(i, i + BATCH).map(fetchCard));
        if (i + BATCH < allNames.length) await new Promise(r => setTimeout(r, 80));
      }
      if (!cancelled) {
        const types = {};
        allNames.forEach(n => { types[n] = cardCache[n]?.type || ''; });
        setCardTypes(types);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [allNames.join('|')]);

  const groupByType = (cards) => {
    const groups = {};
    TYPE_ORDER.forEach(t => { groups[t] = []; });
    cards.forEach(({ qty, name }) => {
      groups[classifyType(cardTypes[name] || '')].push({ qty, name });
    });
    return groups;
  };

  const mainCount = mainCards.reduce((s, c) => s + c.qty, 0);
  const sideCount = sideCards.reduce((s, c) => s + c.qty, 0);
  const mainGroups = groupByType(mainCards);
  const sideGroups = groupByType(sideCards);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Resumen */}
      <div style={{
        display: 'flex', gap: 16, padding: '7px 10px', marginBottom: 6,
        background: 'rgba(139,92,246,0.08)', borderRadius: 7,
        borderLeft: '3px solid #8b5cf6', fontSize: 12, alignItems: 'center',
      }}>
        <span style={{ color: '#8b5cf6', fontWeight: 700 }}>{mainCount} cartas</span>
        {sideCount > 0 && <span style={{ color: '#64748b' }}>+ {sideCount} banquillo</span>}
        <span style={{ color: '#475569', marginLeft: 'auto', fontSize: 11 }}>
          {loading ? 'Cargando tipos…' : 'Pasa el ratón para ver imagen'}
        </span>
      </div>

      {/* ── MAZO ── */}
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: '#475569', padding: '2px 10px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4,
      }}>
        Mazo
      </div>
      {loading
        ? mainCards.map(({ qty, name }) => <CardRow key={name} qty={qty} name={name} />)
        : TYPE_ORDER.map(type => <CardSection key={type} label={type} cards={mainGroups[type]} />)
      }

      {/* ── BANQUILLO ── */}
      {sideCount > 0 && (
        <>
          <button
            onClick={() => setShowSide(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '6px 12px', color: '#64748b',
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', cursor: 'pointer', marginTop: 8,
              width: '100%', textAlign: 'left',
            }}
          >
            <span style={{ flex: 1 }}>Banquillo</span>
            <span style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 10,
              padding: '1px 7px', fontSize: 10, color: '#475569',
            }}>{sideCount}</span>
            <span style={{ fontSize: 10 }}>{showSide ? '▲' : '▼'}</span>
          </button>

          {showSide && (
            <div style={{ paddingLeft: 4, borderLeft: '2px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
              {loading
                ? sideCards.map(({ qty, name }) => <CardRow key={name} qty={qty} name={name} />)
                : TYPE_ORDER.map(type => <CardSection key={type} label={type} cards={sideGroups[type]} />)
              }
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Matchups ───────────────────────────────────────────────────────────────
function computeMatchups(games) {
  const map = {};
  for (const g of games) {
    const opp = g.opponent_archetype || 'Desconocido';
    if (!map[opp]) map[opp] = { wins: 0, losses: 0 };
    if (g.result === 'win') map[opp].wins++;
    else map[opp].losses++;
  }
  return Object.entries(map)
    .map(([opp, { wins, losses }]) => {
      const total = wins + losses;
      return { opp, wins, losses, total, winrate: total > 0 ? Math.round((wins / total) * 100) : 0 };
    })
    .sort((a, b) => b.total - a.total);
}

function MatchupRow({ m }) {
  const color = m.winrate >= 55 ? '#4ade80' : m.winrate < 45 ? '#f87171' : '#facc15';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 70px 60px 110px', gap: 10,
      alignItems: 'center', padding: '10px 16px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        vs {m.opp}
      </span>
      <span style={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
        <span style={{ color: '#4ade80' }}>{m.wins}W</span>{' / '}
        <span style={{ color: '#f87171' }}>{m.losses}L</span>
      </span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontFamily: 'monospace' }}>{m.total}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${m.winrate}%`, height: '100%', background: color, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>{m.winrate}%</span>
      </div>
    </div>
  );
}

// ── Modal principal ────────────────────────────────────────────────────────
export default function MyArchetypeDetails({ user, archetype, deckName, games, decks = [], onClose }) {
  const [showDeck, setShowDeck] = useState(false);

  const relevantGames = useMemo(() => {
    if (archetype) return games.filter(g => g.archetype === archetype);
    if (deckName)  return games.filter(g => g.deck_name === deckName);
    return games;
  }, [games, archetype, deckName]);

  const wins    = relevantGames.filter(g => g.result === 'win').length;
  const losses  = relevantGames.filter(g => g.result === 'loss').length;
  const total   = wins + losses;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const pieData = [{ name: 'Victorias', value: wins }, { name: 'Derrotas', value: losses }];
  const matchups = useMemo(() => computeMatchups(relevantGames), [relevantGames]);
  const title    = archetype ? `Arquetipo: ${archetype}` : `Mazo: ${deckName}`;

  const deck = useMemo(() => {
    if (deckName)  return decks.find(d => d.name === deckName) || null;
    if (archetype) return decks.find(d => d.archetype === archetype) || null;
    return null;
  }, [decks, deckName, archetype]);

  const hasDeck = deck && (deck.mainboard?.length > 0 || deck.sideboard?.length > 0);

  return (
    <Modal onClose={onClose}>
      <div style={{
        background: '#0f172a', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '28px 28px 24px', width: '100%',
        maxWidth: 560, maxHeight: '85vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{title}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {total} partidas · {wins}W / {losses}L
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasDeck && (
              <button onClick={() => setShowDeck(v => !v)} style={{
                background: showDeck ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.1)',
                border: `1px solid ${showDeck ? 'rgba(139,92,246,0.6)' : 'rgba(139,92,246,0.3)'}`,
                color: '#a78bfa', borderRadius: 8, padding: '6px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {showDeck ? '↑ Ocultar mazo' : '↓ Ver mazo'}
              </button>
            )}
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.07)', border: 'none',
              color: 'rgba(255,255,255,0.6)', width: 32, height: 32,
              borderRadius: 8, fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        </div>

        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            No hay partidas para mostrar.
          </div>
        ) : (
          <>
            {/* Pie */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} itemStyle={{ color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 34, fontWeight: 800, color: winrate >= 50 ? '#4ade80' : '#f87171', fontFamily: 'monospace' }}>{winrate}%</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>winrate</span>
                </div>
                {[{ label: 'Victorias', value: wins, color: '#4ade80' }, { label: 'Derrotas', value: losses, color: '#f87171' }].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color, marginLeft: 'auto', fontFamily: 'monospace' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista del mazo */}
            {showDeck && deck && (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)' }}>
                  Lista — {deck.name}
                </h4>
                <DeckList deck={deck} />
              </div>
            )}

            {/* Matchups */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)' }}>
                Matchups
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 110px', gap: 10, padding: '0 16px 4px' }}>
                  {['Rival', 'W/L', 'Total', 'Winrate'].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)', textAlign: h === 'Rival' ? 'left' : 'center' }}>{h}</span>
                  ))}
                </div>
                {matchups.length === 0
                  ? <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '12px 0' }}>Sin datos.</span>
                  : matchups.map(m => <MatchupRow key={m.opp} m={m} />)
                }
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}