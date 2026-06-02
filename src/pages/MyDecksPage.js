import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import useDecks from '../hooks/useDecks';
import useGames from '../hooks/useGames';
import useArchetypes from '../hooks/useArchetypes';
import DeckList from '../components/deck/DeckList';
import EditDeckModal from '../components/deck/EditDeckModal';
import MyStats from '../components/stats/MyStats';

const MyDecksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { decks, loading, error, updateDeck, deleteDeck, archiveDeck } = useDecks(user?.id);
  const { games, loading: gamesLoading } = useGames(user?.id);
  const { archetypes } = useArchetypes();
  const [editingDeck, setEditingDeck] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const handleSaveEdit = async (deckId, updates) => {
    return await updateDeck(deckId, updates);
  };

  if (loading || gamesLoading) return (
    <div className="page">
      <div className="loading-state">
        <div className="spinner" />
        <span>Cargando...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="auth-error">Error: {error}</div>
    </div>
  );

  const activeDecks   = decks.filter(d => !d.archived);
  const archivedDecks = decks.filter(d => d.archived);
  const visibleDecks  = showArchived ? archivedDecks : activeDecks;

  return (
    <div className="page">
      {/* ── Resumen estadísticas (sin botón nuevo torneo) ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="card-title">
            <div className="card-title-icon purple">📊</div>
            <span className="card-title-text">Resumen general</span>
          </div>
          <MyStats
            games={games}
            decks={decks}
            archetypes={archetypes}
            user={user}
          />
        </div>
      </div>

      {/* ── Mis mazos ── */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Mis mazos</h1>
          <p className="page-subtitle">
            {showArchived
              ? `${archivedDecks.length} mazo${archivedDecks.length !== 1 ? 's' : ''} guardado${archivedDecks.length !== 1 ? 's' : ''}`
              : `${activeDecks.length} mazo${activeDecks.length !== 1 ? 's' : ''} activo${activeDecks.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setShowArchived(v => !v)}
            className={`btn ${showArchived ? 'btn-active' : 'btn-ghost'}`}
          >
            {showArchived ? '← Mazos activos' : '📦 Guardados'}
            {archivedDecks.length > 0 && !showArchived && (
              <span style={{ background: 'rgba(108,87,255,.3)', color: '#a89fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 4 }}>
                {archivedDecks.length}
              </span>
            )}
          </button>

          {!showArchived && (
            <button className="btn btn-primary" onClick={() => navigate('/my-decks/new')}>
              + Añadir mazo
            </button>
          )}
        </div>
      </div>

      {visibleDecks.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              {showArchived
                ? <p>No tienes mazos guardados.</p>
                : <p>No tienes mazos activos. ¡Añade uno para empezar!</p>}
            </div>
          </div>
        </div>
      ) : (
        <DeckList
          decks={visibleDecks}
          onEdit={setEditingDeck}
          onDelete={deleteDeck}
          onArchive={(id) => archiveDeck(id, true)}
          onUnarchive={(id) => archiveDeck(id, false)}
          isArchivedView={showArchived}
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
