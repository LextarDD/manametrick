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

  // Determina si una ronda está completa y cuál es su resultado.
  // W+L o L+W sin tercer círculo = empate (draw) en físico.
  // En online ese caso no debería llegar aquí (bloqueado en el form).
  const _getRoundOutcome = (results) => {
    const wins   = results.filter(r => r === 'win').length;
    const losses = results.filter(r => r === 'loss').length;

    if (wins >= 2)   return 'win';
    if (losses >= 2) return 'loss';

    // Empate explícito marcado con el tercer círculo
    if (results.some(r => r === 'draw')) return 'draw';

    // W+L o L+W sin desempate → también es empate (ronda cerrada 1-1)
    if (wins === 1 && losses === 1) return 'draw';

    return null; // incompleta (solo 1 resultado, o ninguno)
  };

  const _insertRoundGames = async ({ rounds, deckId, deckName, deckArchetype, tournamentId, tournamentType }) => {
    const isOnline = tournamentType === 'online';
    const gameRows = [];

    rounds.forEach(round => {
      if (!round.opponentArchetype) return;

      const outcome = _getRoundOutcome(round.results || []);

      // Ronda incompleta: no guardar
      if (!outcome) return;

      // Online: no guardar empates (doble seguridad además de la validación del form)
      if (isOnline && outcome === 'draw') return;

      // Para empates (físico): guardar los dos resultados individuales W y L tal cual
      // Para wins/losses: guardar todos los resultados individuales que tengan valor
      round.results.forEach(result => {
        if (!result) return;
        if (result === 'draw') return; // el círculo '=' no se inserta como fila individual

        gameRows.push({
          user_id:            userId,
          deck_id:            deckId,
          deck_name:          deckName,
          archetype:          deckArchetype || null,
          opponent_archetype: round.opponentArchetype,
          opponent_name:      round.opponentName?.trim() || '',
          result,
          note:               round.note?.trim() || '',
          tournament_id:      tournamentId,
        });
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