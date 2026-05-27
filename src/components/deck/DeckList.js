import DeckCard from './DeckCard';

const DeckList = ({ decks, onEdit, onDelete, onArchive, onUnarchive, isArchivedView = false, expandDeckId = null }) => {
  if (decks.length === 0) {
    return (
      <div className="empty-state">
        <p>No tienes mazos todavía.</p>
        <p className="text-muted">Usa el botón "Añadir mazo" para empezar.</p>
      </div>
    );
  }

  return (
    <div className="deck-list">
      {decks.map(deck => (
        <DeckCard
          key={deck.id}
          deck={deck}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          isArchivedView={isArchivedView}
          defaultExpanded={deck.id === expandDeckId}
        />
      ))}
    </div>
  );
};

export default DeckList;