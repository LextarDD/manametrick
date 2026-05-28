import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import useDecks from '../hooks/useDecks';
import useArchetypes from '../hooks/useArchetypes';

const parseLine = (line) => {
  const match = line.trim().match(/^(\d+)\s+(.+)$/);
  if (!match) return null;
  return { qty: parseInt(match[1], 10), name: match[2].trim() };
};
const parseList = (text) => text.split('\n').map(l => l.trim()).filter(Boolean);
const isSideboardSeparator = (line) => /^sideboard[:\s]*$/i.test(line.trim());
const splitMainSide = (lines) => {
  const sideIdx = lines.findIndex(isSideboardSeparator);
  if (sideIdx === -1) return { main: lines, side: [] };
  return { main: lines.slice(0, sideIdx), side: lines.slice(sideIdx + 1) };
};
const validateCard = async (name) => {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
    if (!res.ok) return { valid: false, name };
    const data = await res.json();
    return { valid: data.legalities?.pauper === 'legal', name: data.name, originalName: name };
  } catch {
    return { valid: false, name };
  }
};

const AddDeckPage = () => {
  const { user } = useAuth();
  const { addDeck } = useDecks(user?.id);
  const { archetypes } = useArchetypes();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState('');
  const [listText, setListText] = useState('');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]); setFormError(null);
    if (!name.trim()) { setFormError('El nombre del mazo es obligatorio.'); return; }
    const lines = parseList(listText);
    if (lines.length === 0) { setFormError('Introduce al menos una carta.'); return; }
    const { main, side } = splitMainSide(lines);
    const mainCards = main.map(parseLine).filter(Boolean);
    const sideCards = side.map(parseLine).filter(Boolean);
    if (mainCards.length === 0) { setFormError('Formato incorrecto. Usa "4 Lightning Bolt".'); return; }

    setValidating(true);
    const uniqueNames = [...new Set([...mainCards, ...sideCards].map(c => c.name))];
    const results = await Promise.all(uniqueNames.map(validateCard));
    const invalid = results.filter(r => !r.valid);
    setValidating(false);

    if (invalid.length > 0) {
      setErrors(invalid.map(r => `"${r.name}" no es legal en Pauper o no existe.`));
      return;
    }

    const nameMap = Object.fromEntries(results.map(r => [r.originalName, r.name]));
    const normalizeLines = (cards) => cards.map(c => `${c.qty} ${nameMap[c.name] ?? c.name}`);

    setSaving(true);
    const result = await addDeck({
      name: name.trim(),
      archetype: archetype || null,
      mainboard: normalizeLines(mainCards),
      sideboard: normalizeLines(sideCards),
    });
    setSaving(false);

    if (result?.error) { setFormError(result.error); return; }
    navigate('/my-decks');
  };

  return (
    <div className="page">
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Nuevo mazo</h1>
          <p className="page-subtitle">Añade un mazo a tu colección</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/my-decks')}>
          ← Volver
        </button>
      </div>

      <div className="card anim-fade-up">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="deck-form">

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Nombre del mazo *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: WW Heroic, Burn..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Arquetipo</label>
                <select value={archetype} onChange={e => setArchetype(e.target.value)}>
                  <option value="">— Sin arquetipo —</option>
                  {archetypes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Lista de cartas (formato MTGO)</label>
              <textarea
                value={listText}
                onChange={e => setListText(e.target.value)}
                placeholder={`4 Lightning Bolt\n4 Monastery Swiftspear\n...\nSideboard\n2 Pyroblast`}
                rows={18}
                className="deck-textarea"
              />
              <span className="form-hint">
                Una carta por línea: <code>4 Lightning Bolt</code>. Escribe <code>Sideboard</code> para separar el banquillo.
              </span>
            </div>

            {errors.length > 0 && (
              <ul className="error-list">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            {formError && <p className="auth-error">{formError}</p>}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/my-decks')}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={validating || saving}>
                {validating ? 'Validando cartas...' : saving ? 'Guardando...' : 'Guardar mazo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDeckPage;