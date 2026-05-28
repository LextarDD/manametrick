import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const useArchetypes = () => {
  const [archetypes, setArchetypes] = useState([]);
  const [archetypeMap, setArchetypeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('archetypes')
        .select('name, type')
        .order('name', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        // Lista de nombres (compatible con todo el código existente)
        setArchetypes(data.map(a => a.name));
        // Mapa name → type para usar en UI
        const map = {};
        data.forEach(a => { map[a.name] = a.type || 'midrange'; });
        setArchetypeMap(map);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { archetypes, archetypeMap, loading, error };
};

export default useArchetypes;