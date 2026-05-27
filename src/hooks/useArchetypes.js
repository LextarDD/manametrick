import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const useArchetypes = () => {
  const [archetypes, setArchetypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('archetypes')
        .select('name')
        .order('name', { ascending: true });

      if (error) setError(error.message);
      else setArchetypes(data.map((a) => a.name));
      setLoading(false);
    };
    fetch();
  }, []);

  return { archetypes, loading, error };
};

export default useArchetypes;
