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
  const { games, loading: gamesLoading, error: gamesError, refetch: refetchGames } = useGames(user?.id);
  const { decks, loading: decksLoading } = useDecks(user?.id);
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament, deleteTournament } = useTournaments(user?.id);
  const { archetypes } = useArchetypes();
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  if (!user) return null;
  const isLoading = gamesLoading || decksLoading || tournamentsLoading;

  const handleEditTournament = async (tournament) => {
    // Refrescar games antes de abrir el formulario para tener datos actualizados
    await refetchGames();
    // Leer los games actualizados directamente de Supabase para esta edición
    const { data: freshGames } = await import('../lib/supabaseClient').then(({ supabase }) =>
      supabase
        .from('games')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
    );
    setEditingTournament({ tournament, games: freshGames || [] });
  };

  const handleSaveNew = async (data) => {
    await addTournament(data);
    await refetchGames();
    setShowTournamentForm(false);
  };

  const handleSaveEdit = async (tournamentData) => {
    await updateTournament(editingTournament.tournament.id, tournamentData);
    await refetchGames();
    setEditingTournament(null);
  };

  if (isLoading) return (
    <div className="page">
      <div className="loading-state">
        <div className="spinner" />
        <span>Cargando estadísticas...</span>
      </div>
    </div>
  );

  if (gamesError) return (
    <div className="page">
      <div className="auth-error">Error al cargar estadísticas: {gamesError}</div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Mis <span className="gradient-text">estadísticas</span></h1>
          <p className="page-subtitle">Análisis de tu rendimiento personal</p>
        </div>
      </div>

      {/* Stats component */}
      <div className="card" style={{ marginBottom: 16, minHeight: 420 }}>
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
            onCreateTournament={() => setShowTournamentForm(true)}
          />
        </div>
      </div>

      {/* Tournament history */}
      <div className="card">
        <div className="card-body">
          <div className="card-title" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="card-title-icon amber">🏆</div>
              <span className="card-title-text">Historial de Torneos</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '6px 14px' }}
              onClick={() => setShowTournamentForm(true)}
            >
              + Nuevo torneo
            </button>
          </div>
          <TournamentHistory
            tournaments={tournaments}
            games={games}
            onDelete={deleteTournament}
            onEdit={handleEditTournament}
          />
        </div>
      </div>

      {showTournamentForm && (
        <TournamentForm
          decks={decks}
          archetypes={archetypes}
          onSave={handleSaveNew}
          onClose={() => setShowTournamentForm(false)}
        />
      )}

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
  );
}