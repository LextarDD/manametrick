import { useState } from 'react';
import Modal from '../shared/Modal';

const parseLine = (line) => {
  const match = line.trim().match(/^(\d+)\s+(.+)$/);
  if (!match) return null;
  return { qty: parseInt(match[1], 10), name: match[2].trim() };
};

const linesToText = (lines) => lines.join('\n');

const validateCard = async (name) => {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
    );
    if (!res.ok) return { valid: false, name };
    const data = await res.json();
    const legal = data.legalities?.pauper === 'legal';
    return { valid: legal, name: data.name, originalName: name };
  } catch {
    return { valid: false, name };
  }
};

// ── CardRow: fila editable para cada carta ─────────────────
const CardRow = ({ line, onChange, onRemove }) => {
  const parsed = parseLine(line);
  if (!parsed) return null;
  const { qty, name } = parsed;

  return (
    <div className="card-row">
      <input
        type="number"
        min="1"
        max="4"
        value={qty}
        onChange={(e) => onChange(`${e.target.value} ${name}`)}
        className="card-qty-input"
      />
      <span className="card-name">{name}</span>
      <button
        type="button"
        className="btn-remove"
        onClick={onRemove}
        aria-label={`Eliminar ${name}`}
      >
        ✕
      </button>
    </div>
  );
};

// ── AddCardSearch: buscar y añadir una carta nueva ──────────
const AddCardSearch = ({ onAdd }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResult(null);

    const res = await validateCard(query.trim());
    if (!res.valid) setSearchError(`"${query}" no es legal en Pauper o no existe.`);
    else setResult(res);
    setSearching(false);
  };

  const handleAdd = () => {
    if (!result) return;
    onAdd(`1 ${result.name}`);
    setQuery('');
    setResult(null);
  };

  return (
    <div className="add-card-search">
      <p className="section-label">Añadir carta</p>
      <div className="search-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre de carta..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? '...' : 'Buscar'}
        </button>
      </div>
      {searchError && <p className="auth-error" style={{ marginTop: '0.4rem' }}>{searchError}</p>}
      {result && (
        <div className="search-result">
          <span>{result.name}</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd}>
            + Añadir
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────
const EditDeckModal = ({ deck, archetypes, onSave, onClose }) => {
  const [name, setName] = useState(deck.name);
  const [archetype, setArchetype] = useState(deck.archetype ?? '');
  const [mainboard, setMainboard] = useState(deck.mainboard ?? []);
  const [sideboard, setSideboard] = useState(deck.sideboard ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('main'); // 'main' | 'side'

  const currentList = tab === 'main' ? mainboard : sideboard;
  const setCurrentList = tab === 'main' ? setMainboard : setSideboard;

  const updateLine = (i, newLine) => {
    setCurrentList((prev) => prev.map((l, idx) => (idx === i ? newLine : l)));
  };

  const removeLine = (i) => {
    setCurrentList((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addCard = (line) => {
    // Si ya existe la carta, suma cantidad
    const parsed = parseLine(line);
    setCurrentList((prev) => {
      const existing = prev.findIndex((l) => {
        const p = parseLine(l);
        return p && p.name.toLowerCase() === parsed.name.toLowerCase();
      });
      if (existing !== -1) {
        const p = parseLine(prev[existing]);
        return prev.map((l, i) =>
          i === existing ? `${p.qty + parsed.qty} ${p.name}` : l
        );
      }
      return [...prev, line];
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true);
    const result = await onSave(deck.id, {
      name: name.trim(),
      archetype: archetype || null,
      mainboard,
      sideboard,
    });
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">Editar mazo</h2>

      <div className="deck-form">
        <div className="form-group">
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Arquetipo</label>
          <select value={archetype} onChange={(e) => setArchetype(e.target.value)}>
            <option value="">— Sin arquetipo —</option>
            {archetypes.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Tabs main / side */}
        <div className="deck-tabs">
          <button
            type="button"
            className={`deck-tab ${tab === 'main' ? 'deck-tab--active' : ''}`}
            onClick={() => setTab('main')}
          >
            Mazo principal ({mainboard.length})
          </button>
          <button
            type="button"
            className={`deck-tab ${tab === 'side' ? 'deck-tab--active' : ''}`}
            onClick={() => setTab('side')}
          >
            Sideboard ({sideboard.length})
          </button>
        </div>

        <div className="card-list">
          {currentList.map((line, i) => (
            <CardRow
              key={i}
              line={line}
              onChange={(newLine) => updateLine(i, newLine)}
              onRemove={() => removeLine(i)}
            />
          ))}
          {currentList.length === 0 && (
            <p className="empty-hint">Sin cartas. Añade desde abajo.</p>
          )}
        </div>

        <AddCardSearch onAdd={addCard} />

        {error && <p className="auth-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditDeckModal;
