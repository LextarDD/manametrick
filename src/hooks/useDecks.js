import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const useDecks = (userId) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDecks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setDecks(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const addDeck = async ({ name, archetype, mainboard, sideboard }) => {
    const { data, error } = await supabase
      .from('decks')
      .insert([{ user_id: userId, name, archetype, mainboard, sideboard, archived: false }])
      .select().single();
    if (error) return { error: error.message };
    setDecks(prev => [data, ...prev]);
    return { data };
  };

  const updateDeck = async (deckId, updates) => {
    const { data, error } = await supabase
      .from('decks').update(updates)
      .eq('id', deckId).eq('user_id', userId)
      .select().single();
    if (error) return { error: error.message };
    setDecks(prev => prev.map(d => d.id === deckId ? data : d));
    return { data };
  };

  const deleteDeck = async (deckId) => {
    const { error } = await supabase
      .from('decks').delete()
      .eq('id', deckId).eq('user_id', userId);
    if (error) return { error: error.message };
    setDecks(prev => prev.filter(d => d.id !== deckId));
    return {};
  };

  // Archivar / desarchivar — solo cambia el flag
  const archiveDeck = async (deckId, archive = true) => {
    return await updateDeck(deckId, { archived: archive });
  };

  return { decks, loading, error, addDeck, updateDeck, deleteDeck, archiveDeck, refetch: fetchDecks };
};

export default useDecks;