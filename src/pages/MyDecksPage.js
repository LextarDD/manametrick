import { useState } from 'react';
import { useAuth } from '../AuthContext';
import useDecks from '../hooks/useDecks';
import useArchetypes from '../hooks/useArchetypes';
import AddDeck from '../components/deck/AddDeck';
import DeckList from '../components/deck/DeckList';
import EditDeckModal from '../components/deck/EditDeckModal';

const MyDecksPage = () => {
  const { user } = useAuth();
  const { decks, loading, error, addDeck, updateDeck, deleteDeck, archiveDeck } = useDecks(user?.id);
  const { archetypes } = useArchetypes();
  const [editingDeck, setEditingDeck] = useState(null);
  const [lastAddedId, setLastAddedId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const handleDeckAdded = async (deckData) => {
    const result = await addDeck(deckData);
    if (result?.data) setLastAddedId(result.data.id);
    return result;
  };

  const handleSaveEdit = async (deckId, updates) => {
    return await updateDeck(deckId, updates);
  };

  if (loading) return <p className="page-loading">Cargando mazos...</p>;
  if (error) return <p className="auth-error">Error: {error}</p>;

  const activeDecks   = decks.filter(d => !d.archived);
  const archivedDecks = decks.filter(d => d.archived);
  const visibleDecks  = showArchived ? archivedDecks : activeDecks;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis mazos</h1>
          <p className="page-subtitle">
            {showArchived
              ? `${archivedDecks.length} mazo${archivedDecks.length !== 1 ? 's' : ''} guardado${archivedDecks.length !== 1 ? 's' : ''}`
              : `${activeDecks.length} mazo${activeDecks.length !== 1 ? 's' : ''} activo${activeDecks.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Toggle mazos guardados */}
          <button
            onClick={() => setShowArchived(v => !v)}
            style={{
              padding: '8px 16px',
              background: showArchived ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showArchived ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8,
              color: showArchived ? '#a78bfa' : '#94a3b8',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {showArchived ? '← Mazos activos' : '📦 Mazos guardados'}
            {archivedDecks.length > 0 && !showArchived && (
              <span style={{
                marginLeft: 6, background: 'rgba(139,92,246,0.3)', color: '#a78bfa',
                borderRadius: 10, padding: '1px 7px', fontSize: 11,
              }}>
                {archivedDecks.length}
              </span>
            )}
          </button>

          {/* Añadir mazo — solo en vista activa */}
          {!showArchived && (
            <AddDeck userId={user.id} archetypes={archetypes} onDeckAdded={handleDeckAdded} />
          )}
        </div>
      </div>

      {visibleDecks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.3)' }}>
          {showArchived
            ? <p>No tienes mazos guardados.</p>
            : <p>No tienes mazos activos. ¡Añade uno!</p>
          }
        </div>
      ) : (
        <DeckList
          decks={visibleDecks}
          onEdit={setEditingDeck}
          onDelete={deleteDeck}
          onArchive={(id) => archiveDeck(id, true)}
          onUnarchive={(id) => archiveDeck(id, false)}
          isArchivedView={showArchived}
          expandDeckId={lastAddedId}
        />
      )}

      {editingDeck && (
        <EditDeckModal
          deck={editingDeck}
          archetypes={archetypes}
          onSave={handleSaveEdit}
          onClose={() => setEditingDeck(null)}
        />
      )}
    </div>
  );
};

export default MyDecksPage;