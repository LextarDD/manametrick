import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import useGames from '../hooks/useGames';
import useDecks from '../hooks/useDecks';
import useTournaments from '../hooks/useTournaments';
import useArchetypes from '../hooks/useArchetypes';
import MyStats from '../components/stats/MyStats';
import TournamentForm from '../components/tournament/TournamentForm';
import TournamentHistory from '../components/tournament/TournamentHistory';

export default function MyStatsPage() {
  const { user } = useAuth();
  const { games, loading: gamesLoading, error: gamesError } = useGames(user?.id);
  const { decks, loading: decksLoading } = useDecks(user?.id);
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament, deleteTournament } = useTournaments(user?.id);
  const { archetypes } = useArchetypes();

  const [showTournamentForm, setShowTournamentForm] = useState(false);
  // editingTournament = { tournament, games } | null
  const [editingTournament, setEditingTournament] = useState(null);

  if (!user) return null;

  const isLoading = gamesLoading || decksLoading || tournamentsLoading;

  const handleEditTournament = (tournament) => {
    // Filtrar las partidas de este torneo para reconstruir los rounds
    const tournamentGames = games.filter(g => g.tournament_id === tournament.id);
    setEditingTournament({ tournament, games: tournamentGames });
  };

  const handleSaveEdit = async (tournamentData) => {
    await updateTournament(editingTournament.tournament.id, tournamentData);
    setEditingTournament(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1e',
      color: '#e2e8f0',
      padding: '32px 24px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {isLoading ? (
          <LoadingState />
        ) : gamesError ? (
          <ErrorState message={gamesError} />
        ) : (
          <>
            <MyStats
              games={games}
              decks={decks}
              archetypes={archetypes}
              user={user}
              onCreateTournament={() => setShowTournamentForm(true)}
            />

            <section>
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
                Historial de Torneos
              </h2>
              <TournamentHistory
                tournaments={tournaments}
                games={games}
                onDelete={deleteTournament}
                onEdit={handleEditTournament}
              />
            </section>
          </>
        )}

        {/* Modal: nuevo torneo */}
        {showTournamentForm && (
          <TournamentForm
            decks={decks}
            archetypes={archetypes}
            onSave={async (data) => {
              await addTournament(data);
              setShowTournamentForm(false);
            }}
            onClose={() => setShowTournamentForm(false)}
          />
        )}

        {/* Modal: editar torneo */}
        {editingTournament && (
          <TournamentForm
            decks={decks}
            archetypes={archetypes}
            initialData={editingTournament}
            onSave={handleSaveEdit}
            onClose={() => setEditingTournament(null)}
          />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '48px 0', alignItems: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Cargando estadísticas…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ padding: '20px 24px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, color: '#f87171', fontSize: 14 }}>
      Error al cargar estadísticas: {message}
    </div>
  );
}