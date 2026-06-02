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

  // Determina el outcome de una ronda y su score para mostrar en historial.
  // Devuelve { outcome, score } o null si la ronda está incompleta.
  const _getRoundResult = (results) => {
    const wins   = results.filter(r => r === 'win').length;
    const losses = results.filter(r => r === 'loss').length;

    if (wins >= 2 && losses === 0) return { outcome: 'win',  score: '2-0' };
    if (wins >= 2 && losses === 1) return { outcome: 'win',  score: '2-1' };
    if (losses >= 2 && wins === 0) return { outcome: 'loss', score: '0-2' };
    if (losses >= 2 && wins === 1) return { outcome: 'loss', score: '1-2' };

    // Empate explícito (círculo '=') o W+L sin desempate
    if (results.some(r => r === 'draw') || (wins === 1 && losses === 1)) {
      return { outcome: 'draw', score: '1-1' };
    }

    return null; // incompleta
  };

  const _insertRoundGames = async ({ rounds, deckId, deckName, deckArchetype, tournamentId, tournamentType }) => {
    const isOnline = tournamentType === 'online';
    const gameRows = [];

    rounds.forEach(round => {
      if (!round.opponentArchetype) return;

      const roundResult = _getRoundResult(round.results || []);

      // Ronda incompleta: no guardar
      if (!roundResult) return;

      // Online: no guardar empates
      if (isOnline && roundResult.outcome === 'draw') return;

      // Una sola fila por ronda con el resultado y score de la ronda completa
      gameRows.push({
        user_id:            userId,
        deck_id:            deckId,
        deck_name:          deckName,
        archetype:          deckArchetype || null,
        opponent_archetype: round.opponentArchetype,
        opponent_name:      round.opponentName?.trim() || '',
        result:             roundResult.outcome,
        score:              roundResult.score,
        note:               round.note?.trim() || '',
        tournament_id:      tournamentId,
      });
    });

    if (gameRows.length > 0) {
      const { error } = await supabase.from('games').insert(gameRows);
      if (error) throw new Error(error.message);
    }
  };

  const addTournament = async ({ deckId, deckName, deckArchetype, name, type, rounds }) => {
    const tournamentType = type || 'physical';

    const { data: tournamentRow, error: tErr } = await supabase
      .from('tournaments')
      .insert([{
        user_id:   userId,
        deck_id:   deckId,
        deck_name: deckName,
        name:      name || '',
        type:      tournamentType,
      }])
      .select().single();
    if (tErr) throw new Error(tErr.message);

    await _insertRoundGames({
      rounds, deckId, deckName, deckArchetype,
      tournamentId: tournamentRow.id,
      tournamentType,
    });

    await fetchTournaments();
    return { tournament: tournamentRow };
  };

  const updateTournament = async (tournamentId, { deckId, deckName, deckArchetype, name, type, rounds }) => {
    const tournamentType = type || 'physical';

    const { error: tErr } = await supabase
      .from('tournaments')
      .update({ name: name || '', deck_id: deckId, deck_name: deckName, type: tournamentType })
      .eq('id', tournamentId).eq('user_id', userId);
    if (tErr) throw new Error(tErr.message);

    const { error: dErr } = await supabase
      .from('games').delete()
      .eq('tournament_id', tournamentId).eq('user_id', userId);
    if (dErr) throw new Error(dErr.message);

    await _insertRoundGames({
      rounds, deckId, deckName, deckArchetype,
      tournamentId,
      tournamentType,
    });

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