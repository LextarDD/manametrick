import React, { useState } from 'react';
import DeckViewer from './DeckViewer';

export default function DeckCard({ deck, onEdit, onDelete, onArchive, onUnarchive, isArchivedView = false, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const mainCount = (deck.mainboard || [])
    .filter(l => l.trim() && !/^sideboard[:\s]*$/i.test(l.trim()))
    .reduce((sum, line) => {
      const m = line.match(/^(\d+)/);
      return sum + (m ? parseInt(m[1], 10) : 0);
    }, 0);

  const sideCount = (deck.sideboard || [])
    .filter(l => l.trim())
    .reduce((sum, line) => {
      const m = line.match(/^(\d+)/);
      return sum + (m ? parseInt(m[1], 10) : 0);
    }, 0);

  return (
    <div style={{
      ...styles.card,
      borderColor: isArchivedView ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.08)',
    }}>
      {/* Header row */}
      <div style={styles.header}>
        <button style={styles.expandBtn} onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
          <span style={styles.expandIcon}>{expanded ? '▾' : '▸'}</span>
          <div style={styles.deckInfo}>
            <span style={styles.deckName}>{deck.name}</span>
            {deck.archetype && (
              <span style={styles.archetypePill}>{deck.archetype}</span>
            )}
            {isArchivedView && (
              <span style={styles.archivedPill}>📦 Guardado</span>
            )}
          </div>
          <div style={styles.counts}>
            <span style={styles.countBadge}>{mainCount} main</span>
            {sideCount > 0 && (
              <span style={{ ...styles.countBadge, ...styles.countBadgeSide }}>{sideCount} side</span>
            )}
          </div>
        </button>

        <div style={styles.actions}>
          {/* Editar — solo en vista activa */}
          {!isArchivedView && (
            <button style={styles.actionBtn} onClick={() => onEdit(deck)} title="Editar mazo">✎</button>
          )}

          {/* Guardar / Sacar de guardados */}
          {!isArchivedView ? (
            <button
              style={{ ...styles.actionBtn, ...styles.actionBtnArchive }}
              onClick={() => onArchive && onArchive(deck.id)}
              title="Guardar mazo (archivar)"
            >
              📦
            </button>
          ) : (
            <button
              style={{ ...styles.actionBtn, ...styles.actionBtnUnarchive }}
              onClick={() => onUnarchive && onUnarchive(deck.id)}
              title="Sacar de guardados"
            >
              ↩ Activar
            </button>
          )}

          {/* Eliminar */}
          {confirmDelete ? (
            <>
              <button
                style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                onClick={() => onDelete(deck.id)}
              >
                ✓ Confirmar
              </button>
              <button style={styles.actionBtn} onClick={() => setConfirmDelete(false)}>✕</button>
            </>
          ) : (
            <button
              style={{ ...styles.actionBtn, ...styles.actionBtnDelete }}
              onClick={() => setConfirmDelete(true)}
              title="Eliminar mazo"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={styles.viewerWrapper}>
          <DeckViewer mainboard={deck.mainboard || []} sideboard={deck.sideboard || []} />
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
  },
  expandBtn: {
    flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
  },
  expandIcon: { fontSize: '14px', color: '#8b5cf6', width: '14px', flexShrink: 0 },
  deckInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  deckName: { fontSize: '15px', fontWeight: '600', color: '#e2e8f0' },
  archetypePill: {
    fontSize: '11px', fontWeight: '500', color: '#a78bfa',
    background: 'rgba(139,92,246,0.12)', padding: '2px 8px',
    borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)',
  },
  archivedPill: {
    fontSize: '11px', color: '#64748b',
    background: 'rgba(100,116,139,0.1)', padding: '2px 8px',
    borderRadius: '10px', border: '1px solid rgba(100,116,139,0.2)',
  },
  counts: { display: 'flex', gap: '6px', flexShrink: 0 },
  countBadge: {
    fontSize: '11px', color: '#64748b',
    background: 'rgba(100,116,139,0.1)', padding: '2px 7px',
    borderRadius: '8px', fontWeight: '500',
  },
  countBadgeSide: { color: '#475569' },
  actions: { display: 'flex', gap: '6px', flexShrink: 0 },
  actionBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px', padding: '5px 9px',
    cursor: 'pointer', fontSize: '13px', color: '#94a3b8',
    transition: 'background 0.15s, color 0.15s',
  },
  actionBtnArchive: { color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.2)' },
  actionBtnUnarchive: {
    color: '#a78bfa', borderColor: 'rgba(139,92,246,0.3)',
    background: 'rgba(139,92,246,0.08)', fontSize: '12px', fontWeight: '600',
  },
  actionBtnDelete: { color: '#64748b' },
  actionBtnDanger: {
    color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.08)', fontSize: '12px', fontWeight: '600',
  },
  viewerWrapper: {
    borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px 20px',
  },
};