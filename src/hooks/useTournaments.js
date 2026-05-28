import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const useTournaments = (userId) => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTournaments = useCallback(async () => {
    if (!userId) { setTournaments([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('tournaments').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setTournaments(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const _insertRoundGames = async ({ rounds, deckId, deckName, deckArchetype, tournamentId }) => {
    const gameRows = [];
    rounds.forEach(round => {
      if (!round.opponentArchetype) return;
      round.results.forEach(result => {
        if (!result) return;
        gameRows.push({
          user_id: userId,
          deck_id: deckId,
          deck_name: deckName,
          archetype: deckArchetype || null,
          opponent_archetype: round.opponentArchetype,
          opponent_name: round.opponentName?.trim() || '',
          result,
          note: round.note?.trim() || '',  // ← antes siempre era ''
          tournament_id: tournamentId,
        });
      });
    });
    if (gameRows.length > 0) {
      const { error } = await supabase.from('games').insert(gameRows);
      if (error) throw new Error(error.message);
    }
  };

  const addTournament = async ({ deckId, deckName, deckArchetype, name, rounds }) => {
    const { data: tournamentRow, error: tErr } = await supabase
      .from('tournaments')
      .insert([{ user_id: userId, deck_id: deckId, deck_name: deckName, name: name || '' }])
      .select().single();
    if (tErr) throw new Error(tErr.message);
    await _insertRoundGames({ rounds, deckId, deckName, deckArchetype, tournamentId: tournamentRow.id });
    await fetchTournaments();
    return { tournament: tournamentRow };
  };

  const updateTournament = async (tournamentId, { deckId, deckName, deckArchetype, name, rounds }) => {
    const { error: tErr } = await supabase
      .from('tournaments').update({ name: name || '', deck_id: deckId, deck_name: deckName })
      .eq('id', tournamentId).eq('user_id', userId);
    if (tErr) throw new Error(tErr.message);

    const { error: dErr } = await supabase
      .from('games').delete()
      .eq('tournament_id', tournamentId).eq('user_id', userId);
    if (dErr) throw new Error(dErr.message);

    await _insertRoundGames({ rounds, deckId, deckName, deckArchetype, tournamentId });
    await fetchTournaments();
  };

  const deleteTournament = async (tournamentId) => {
    const { error: gErr } = await supabase.from('games').delete()
      .eq('tournament_id', tournamentId).eq('user_id', userId);
    if (gErr) throw new Error(gErr.message);
    const { error: tErr } = await supabase.from('tournaments').delete()
      .eq('id', tournamentId).eq('user_id', userId);
    if (tErr) throw new Error(tErr.message);
    setTournaments(prev => prev.filter(t => t.id !== tournamentId));
  };

  return { tournaments, loading, error, addTournament, updateTournament, deleteTournament, refetch: fetchTournaments };
};

export default useTournaments;