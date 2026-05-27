import React, { useState, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ORDER = [
  'Creatures',
  'Spells',     // Sorceries + Instants
  'Enchantments',
  'Artifacts',
  'Lands',
  'Other',
];

const TYPE_LABELS = {
  Creatures: 'Criaturas',
  Spells: 'Instantáneos & Conjuros',
  Enchantments: 'Encantamientos',
  Artifacts: 'Artefactos',
  Lands: 'Tierras',
  Other: 'Otros',
};

// Scryfall cache to avoid duplicate requests
const cardCache = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a line like "4 Lightning Bolt" → { qty: 4, name: "Lightning Bolt" }
 */
function parseLine(line) {
  const match = line.trim().match(/^(\d+)\s+(.+)$/);
  if (!match) return null;
  return { qty: parseInt(match[1], 10), name: match[2].trim() };
}

/**
 * Fetch card data from Scryfall (with in-memory cache)
 */
async function fetchCard(name) {
  if (cardCache[name]) return cardCache[name];
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    cardCache[name] = data;
    return data;
  } catch {
    return null;
  }
}

/**
 * Classify a card by type line into our groups
 */
function classifyType(typeLine = '') {
  const t = typeLine.toLowerCase();
  if (t.includes('creature')) return 'Creatures';
  if (t.includes('instant') || t.includes('sorcery')) return 'Spells';
  if (t.includes('enchantment')) return 'Enchantments';
  if (t.includes('artifact')) return 'Artifacts';
  if (t.includes('land')) return 'Lands';
  return 'Other';
}

/**
 * Extract mana cost symbols and count total CMC pips
 */
function countManaPips(manaCost = '') {
  const matches = manaCost.match(/\{([^}]+)\}/g) || [];
  let total = 0;
  for (const pip of matches) {
    const inner = pip.slice(1, -1);
    const num = parseInt(inner, 10);
    if (!isNaN(num)) total += num;
    else if (inner !== 'X') total += 1;
  }
  return total;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardImage({ cardData, qty, name }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const imageUrl =
    cardData?.image_uris?.normal ||
    cardData?.card_faces?.[0]?.image_uris?.normal ||
    null;

  if (!imageUrl || imgError) {
    return (
      <div style={styles.cardFallbackItem}>
        <span style={styles.cardFallbackQty}>{qty}x</span>
        <span style={styles.cardFallbackName}>{name}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.cardWrapper,
        transform: hovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {qty > 1 && <span style={styles.cardQtyBadge}>{qty}×</span>}
      <img
        src={imageUrl}
        alt={name}
        style={styles.cardImage}
        onError={() => setImgError(true)}
        loading="lazy"
      />
      {hovered && (
        <div style={styles.cardTooltip}>{name}</div>
      )}
    </div>
  );
}

function TypeSection({ label, cards, fallbackMode }) {
  if (!cards || cards.length === 0) return null;

  const totalCount = cards.reduce((sum, c) => sum + c.qty, 0);

  return (
    <div style={styles.typeSection}>
      <div style={styles.typeSectionHeader}>
        <span style={styles.typeSectionLabel}>{label}</span>
        <span style={styles.typeSectionCount}>{totalCount}</span>
      </div>

      {fallbackMode ? (
        <div style={styles.fallbackList}>
          {cards.map(({ qty, name }) => (
            <div key={name} style={styles.cardFallbackItem}>
              <span style={styles.cardFallbackQty}>{qty}x</span>
              <span style={styles.cardFallbackName}>{name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.cardGrid}>
          {cards.map(({ qty, name, cardData }) => (
            <CardImage key={name} qty={qty} name={name} cardData={cardData} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DeckViewer({ mainboard = [], sideboard = [] }) {
  const [cardDataMap, setCardDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Parse lines into { qty, name } objects
  const parseLines = useCallback((lines) =>
    lines
      .filter((l) => l.trim() && !l.toLowerCase().startsWith('sideboard'))
      .map(parseLine)
      .filter(Boolean),
    []
  );

  const mainCards = parseLines(mainboard);
  const sideCards = parseLines(sideboard);
  const allNames = [...new Set([...mainCards, ...sideCards].map((c) => c.name))];

  useEffect(() => {
    if (allNames.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch in small batches to avoid rate limiting
        const BATCH = 8;
        const results = {};
        for (let i = 0; i < allNames.length; i += BATCH) {
          const batch = allNames.slice(i, i + BATCH);
          const fetched = await Promise.all(batch.map((name) => fetchCard(name)));
          batch.forEach((name, idx) => {
            results[name] = fetched[idx];
          });
          // Small delay between batches
          if (i + BATCH < allNames.length) {
            await new Promise((r) => setTimeout(r, 80));
          }
        }
        if (!cancelled) {
          setCardDataMap(results);
          // If none loaded properly, switch to fallback
          const anyLoaded = Object.values(results).some((d) => d?.image_uris?.normal);
          if (!anyLoaded) setFetchFailed(true);
        }
      } catch {
        if (!cancelled) setFetchFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainboard.join('|'), sideboard.join('|')]);

  // Group cards by type
  const groupByType = (cards) => {
    const groups = {};
    TYPE_ORDER.forEach((t) => { groups[t] = []; });

    for (const { qty, name } of cards) {
      const data = cardDataMap[name];
      const typeLine = data?.type_line || data?.card_faces?.[0]?.type_line || '';
      const group = classifyType(typeLine);
      groups[group].push({ qty, name, cardData: data });
    }
    return groups;
  };

  // Calculate total CMC
  const totalCMC = mainCards.reduce((sum, { qty, name }) => {
    const data = cardDataMap[name];
    const manaCost = data?.mana_cost || data?.card_faces?.[0]?.mana_cost || '';
    return sum + qty * countManaPips(manaCost);
  }, 0);

  const mainGroups = groupByType(mainCards);
  const sideGroups = groupByType(sideCards);
  const mainCount = mainCards.reduce((s, c) => s + c.qty, 0);
  const sideCount = sideCards.reduce((s, c) => s + c.qty, 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Cargando cartas…</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Summary bar */}
      <div style={styles.summaryBar}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>MAZO</span>
          <span style={styles.summaryValue}>{mainCount} cartas</span>
        </div>
        {!fetchFailed && (
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>CMC TOTAL</span>
            <span style={styles.summaryValue}>{totalCMC}</span>
          </div>
        )}
        {sideCount > 0 && (
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>SIDEBOARD</span>
            <span style={styles.summaryValue}>{sideCount} cartas</span>
          </div>
        )}
        {fetchFailed && (
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryLabel, color: '#e67e22' }}>
              ⚠ Sin imágenes
            </span>
          </div>
        )}
      </div>

      {/* Mainboard */}
      <div style={styles.boardSection}>
        <h4 style={styles.boardTitle}>Maindeck</h4>
        {TYPE_ORDER.map((type) => (
          <TypeSection
            key={type}
            label={TYPE_LABELS[type]}
            cards={mainGroups[type]}
            fallbackMode={fetchFailed}
          />
        ))}
      </div>

      {/* Sideboard */}
      {sideCount > 0 && (
        <div style={styles.boardSection}>
          <h4 style={styles.boardTitle}>Sideboard</h4>
          {fetchFailed ? (
            <div style={styles.fallbackList}>
              {sideCards.map(({ qty, name }) => (
                <div key={name} style={styles.cardFallbackItem}>
                  <span style={styles.cardFallbackQty}>{qty}x</span>
                  <span style={styles.cardFallbackName}>{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {sideCards.map(({ qty, name }) => (
                <CardImage key={name} qty={qty} name={name} cardData={cardDataMap[name]} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '12px 0',
  },

  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '32px',
    color: '#888',
  },

  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #333',
    borderTop: '2px solid #8b5cf6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  loadingText: {
    fontSize: '14px',
    color: '#888',
    letterSpacing: '0.5px',
  },

  summaryBar: {
    display: 'flex',
    gap: '24px',
    padding: '10px 16px',
    background: 'rgba(139, 92, 246, 0.08)',
    borderRadius: '8px',
    borderLeft: '3px solid #8b5cf6',
    flexWrap: 'wrap',
  },

  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  summaryLabel: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: '#8b5cf6',
    textTransform: 'uppercase',
  },

  summaryValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e2e8f0',
  },

  boardSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  boardTitle: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#64748b',
  },

  typeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  typeSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  typeSectionLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: '0.5px',
  },

  typeSectionCount: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    background: 'rgba(100, 116, 139, 0.15)',
    padding: '1px 6px',
    borderRadius: '10px',
  },

  cardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },

  cardWrapper: {
    position: 'relative',
    width: '80px',
    flexShrink: 0,
    transition: 'transform 0.18s ease, z-index 0s',
    cursor: 'pointer',
  },

  cardImage: {
    width: '80px',
    borderRadius: '5px',
    display: 'block',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },

  cardQtyBadge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    background: '#8b5cf6',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 5px',
    borderRadius: '10px',
    zIndex: 2,
    lineHeight: 1,
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },

  cardTooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 6px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15, 15, 25, 0.95)',
    color: '#e2e8f0',
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 20,
    border: '1px solid rgba(139, 92, 246, 0.4)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },

  fallbackList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  cardFallbackItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.03)',
    fontSize: '13px',
  },

  cardFallbackQty: {
    color: '#8b5cf6',
    fontWeight: '700',
    minWidth: '24px',
    fontSize: '12px',
  },

  cardFallbackName: {
    color: '#cbd5e1',
  },
};

// Inject keyframe animation for spinner
if (typeof document !== 'undefined') {
  const styleId = 'deckviewer-spin';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(s);
  }
}
