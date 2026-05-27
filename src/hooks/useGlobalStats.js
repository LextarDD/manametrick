import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const useGlobalStats = () => {
  const [archetypeStats, setArchetypeStats] = useState([]);
  const [matchupMatrix, setMatchupMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      const [statsResult, matrixResult] = await Promise.all([
        supabase
          .from('archetype_stats')
          .select('*')
          .order('total', { ascending: false }),
        supabase
          .from('matchup_matrix')
          .select('*'),
      ]);

      if (statsResult.error) {
        setError(statsResult.error.message);
        setLoading(false);
        return;
      }

      if (matrixResult.error) {
        setError(matrixResult.error.message);
        setLoading(false);
        return;
      }

      setArchetypeStats(statsResult.data || []);
      setMatchupMatrix(matrixResult.data || []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  return { archetypeStats, matchupMatrix, loading, error };
};

export default useGlobalStats;
