import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const useGames = (userId) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setGames(data || []);
    }
    setLoading(false);
  };

  const addGame = async (gameData) => {
    const { data, error } = await supabase
      .from('games')
      .insert([{ ...gameData, user_id: userId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    setGames((prev) => [data, ...prev]);
    return data;
  };

  const deleteGame = async (gameId) => {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  return { games, loading, error, addGame, deleteGame, refetch: fetchGames };
};

export default useGames;
