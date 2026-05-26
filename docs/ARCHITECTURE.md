# ManaMetrick — Architecture

## Stack
- **Frontend**: React (Create React App)
- **Routing**: React Router v6
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Charts**: Recharts
- **Estilos**: CSS propio (`styles.css`) + inline styles
- **API externa**: Scryfall

## Supabase — Esquema de base de datos

### Tabla: `archetypes`
```sql
id        uuid PRIMARY KEY DEFAULT gen_random_uuid()
name      text NOT NULL UNIQUE
```

### Tabla: `decks`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES auth.users NOT NULL
name        text NOT NULL
archetype   text REFERENCES archetypes(name)
mainboard   text[]   -- ["4 Lightning Bolt", ...]
sideboard   text[]
created_at  timestamptz DEFAULT now()
```

### Tabla: `games`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid REFERENCES auth.users NOT NULL
deck_id             uuid REFERENCES decks(id) ON DELETE CASCADE
deck_name           text
archetype           text
opponent_archetype  text
result              text CHECK (result IN ('win', 'loss'))
note                text DEFAULT ''
tournament_id       uuid REFERENCES tournaments(id) ON DELETE SET NULL
created_at          timestamptz DEFAULT now()
```

### Tabla: `tournaments`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES auth.users NOT NULL
deck_id     uuid REFERENCES decks(id) ON DELETE CASCADE
deck_name   text
name        text DEFAULT ''
created_at  timestamptz DEFAULT now()
```

## Supabase — Row Level Security (RLS)

Todas las tablas tienen RLS activado:
- `decks`, `games`, `tournaments`: SELECT/INSERT/UPDATE/DELETE solo si `user_id = auth.uid()`
- `archetypes`: SELECT público, INSERT/DELETE solo admin
- Stats globales: vistas SQL con SELECT público (sin filtro de usuario)

## Supabase — Vistas para stats globales

```sql
-- Winrate por arquetipo (usado en GlobalStats y ArchetypePage)
CREATE VIEW archetype_stats AS
SELECT
  archetype,
  COUNT(*) FILTER (WHERE result = 'win') AS wins,
  COUNT(*) FILTER (WHERE result = 'loss') AS losses,
  COUNT(*) AS total,
  ROUND(COUNT(*) FILTER (WHERE result = 'win') * 100.0 / COUNT(*), 1) AS winrate
FROM games
WHERE archetype IS NOT NULL
GROUP BY archetype
ORDER BY total DESC;

-- Matchup matrix global
CREATE VIEW matchup_matrix AS
SELECT
  archetype AS player_archetype,
  opponent_archetype,
  COUNT(*) FILTER (WHERE result = 'win') AS wins,
  COUNT(*) AS total,
  ROUND(COUNT(*) FILTER (WHERE result = 'win') * 100.0 / COUNT(*), 1) AS winrate
FROM games
WHERE archetype IS NOT NULL AND opponent_archetype IS NOT NULL
GROUP BY archetype, opponent_archetype;
```

## Estructura de carpetas

```
src/
├── components/
│   ├── deck/
│   │   ├── AddDeck.js
│   │   ├── DeckList.js
│   │   ├── DeckCard.js
│   │   ├── DeckViewer.js
│   │   └── EditDeckModal.js
│   ├── stats/
│   │   ├── GlobalStats.js
│   │   ├── MyStats.js
│   │   ├── ArchetypeDetails.js
│   │   ├── MyArchetypeDetails.js
│   │   └── MatchupMatrix.js
│   ├── games/
│   │   ├── GameHistory.js
│   │   ├── AddGameModal.js
│   │   └── GameFilters.js
│   ├── tournament/
│   │   ├── TournamentForm.js
│   │   ├── TournamentHistory.js
│   │   └── TournamentRound.js
│   ├── matchup/
│   │   ├── MyMatchupMatrix.js
│   │   └── MyMatchupMatrixDetails.js
│   └── shared/
│       ├── Auth.js
│       ├── Navbar.js
│       └── Modal.js
│
├── hooks/
│   ├── useDecks.js
│   ├── useGames.js
│   ├── useTournaments.js
│   ├── useGlobalStats.js
│   └── useArchetypes.js
│
├── pages/
│   ├── HomePage.js
│   ├── ArchetypePage.js
│   ├── MyDecksPage.js
│   ├── MyStatsPage.js
│   ├── MyMatchupPage.js
│   └── GameHistoryPage.js
│
├── lib/
│   └── supabaseClient.js   -- inicialización del cliente Supabase
│
├── AuthContext.js
├── App.js
├── styles.css
└── index.js
```

## Cliente Supabase

```js
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Variables de entorno necesarias en `.env`:
```
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxxx
```

## Routing (React Router v6)

```
/                    → HomePage (público)
/archetype/:name     → ArchetypePage (público)
/my-decks            → MyDecksPage (privado)
/my-stats            → MyStatsPage (privado)
/my-matchup          → MyMatchupPage (privado)
/my-games            → GameHistoryPage (privado)
```

Las rutas privadas redirigen a `/` si no hay sesión activa.

## Gestión de estado

- **Auth**: `AuthContext` con `supabase.auth.getSession()` y `onAuthStateChange`
- **Datos remotos**: hooks custom por dominio
- **UI local**: `useState` dentro del componente que lo necesita
- **Sin Redux ni Zustand**

## Patrón de hooks

```js
const useDecks = (userId) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchDecks = async () => {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setDecks(data);
      setLoading(false);
    };
    fetchDecks();
  }, [userId]);

  return { decks, loading, error, addDeck, updateDeck, deleteDeck };
};
```

## Manejo de errores
- Toda query a Supabase desestructura `{ data, error }`
- Si `error` existe, se expone en el hook y el componente muestra mensaje visible
- Nunca pantalla en blanco

## Convenciones
- Componentes: PascalCase (`DeckCard.js`)
- Hooks: camelCase con prefijo `use` (`useDecks.js`)
- Páginas: PascalCase con sufijo `Page` (`MyDecksPage.js`)
- Columnas en Supabase: snake_case (`user_id`, `created_at`)
- Props en React: camelCase (`userId`, `deckName`)
- Timestamps: guardar como `new Date().toISOString()`, mostrar con `toLocaleDateString()`
- RLS siempre activado — nunca usar service role key en el frontend
