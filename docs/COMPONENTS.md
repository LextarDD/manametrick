# ManaMetrick — Components & Pages

## Páginas (pages/)

### HomePage `/`
- **Acceso**: público
- **Muestra**: GlobalStats + Matchup Matrix global
- **Hooks**: `useGlobalStats`, `useArchetypes`

### ArchetypePage `/archetype/:name`
- **Acceso**: público
- **Muestra**: detalle completo de un arquetipo (winrate, matchups, gráfico)
- **Hooks**: `useGlobalStats`
- **Props de ruta**: `name` (nombre del arquetipo)

### MyDecksPage `/my-decks`
- **Acceso**: privado
- **Muestra**: lista de mazos del usuario + botón de añadir
- **Hooks**: `useDecks(userId)`, `useArchetypes`

### MyStatsPage `/my-stats`
- **Acceso**: privado
- **Muestra**: gráficos de winrate personal + formulario de torneo + historial de torneos
- **Hooks**: `useGames(userId)`, `useDecks(userId)`, `useTournaments(userId)`, `useArchetypes`

### MyMatchupPage `/my-matchup`
- **Acceso**: privado
- **Muestra**: matriz de matchups personal
- **Hooks**: `useGames(userId)`

### GameHistoryPage `/my-games`
- **Acceso**: privado
- **Muestra**: historial de partidas con filtros + botón añadir partida suelta
- **Hooks**: `useGames(userId)`, `useDecks(userId)`

---

## Componentes de Deck (components/deck/)

### AddDeck
- **Props**: `{ userId, onDeckAdded }`
- **Hace**: botón que abre modal con formulario. Valida cartas contra Scryfall antes de guardar.
- **Formato lista**: MTGO (`4 Lightning Bolt`)
- **Separador sideboard**: línea que empieza por "Sideboard"

### DeckList
- **Props**: `{ decks, onEdit, onDelete, expandDeckId }`
- **Hace**: lista de DeckCard. Recibe los decks ya cargados desde la página.

### DeckCard
- **Props**: `{ deck, onEdit, onDelete, defaultExpanded }`
- **Hace**: tarjeta expandible con nombre y arquetipo. Al expandir muestra DeckViewer.

### DeckViewer
- **Props**: `{ mainboard, sideboard }`
- **Hace**:
  - Grid de imágenes de cartas (via Scryfall) agrupadas por tipo (criaturas, conjuros, instantáneos, encantamientos, artefactos, tierras)
  - Muestra coste de maná total del mazo
  - Hover sobre imagen muestra nombre
  - Fallback: lista de texto si Scryfall no responde

### EditDeckModal
- **Props**: `{ deck, onSave, onClose }`
- **Hace**: editar nombre, arquetipo, cantidades de cartas existentes y añadir cartas nuevas (búsqueda por nombre con Scryfall)

---

## Componentes de Stats (components/stats/)

### GlobalStats
- **Props**: ninguna
- **Hace**: tabla de winrate por arquetipo (todos) + tabla Top 8 entre sí. Filas clicables → ArchetypeDetails. Nombres de arquetipo son links a `/archetype/:name`

### ArchetypeDetails
- **Props**: `{ archetype, onClose, filterTop8Only?, top8Names? }`
- **Hace**: modal con gráfico de tarta + lista de matchups del arquetipo seleccionado

### MyStats
- **Props**: `{ games, decks, archetypes, onCreateTournament }`
- **Hace**: gráficos de winrate para todos los arquetipos y mazos del usuario (ordenables por winrate). Cada gráfico es clicable → MyArchetypeDetails

### MyArchetypeDetails
- **Props**: `{ user, archetype?, deckName?, onClose }`
- **Hace**: modal con gráfico de tarta + matchups filtrados por usuario

### MatchupMatrix
- **Props**: `{ matrix, archetypeList, onSelectArchetype }`
- **Hace**: tabla cruzada con código de colores. Reutilizable para global y personal.

---

## Componentes de Games (components/games/)

### GameHistory
- **Props**: `{ games, decks }`
- **Hace**: lista de partidas con fecha, mazo, arquetipo rival, resultado y nota. Ordenadas por fecha desc.

### AddGameModal
- **Props**: `{ decks, archetypes, onSave, onClose }`
- **Hace**: formulario para registrar una partida suelta (mazo, arquetipo rival, resultado win/loss, nota opcional)

### GameFilters
- **Props**: `{ decks, onFilterChange }`
- **Hace**: filtros por rango de fechas y por mazo. Emite los filtros activos al padre.

---

## Componentes de Tournament (components/tournament/)

### TournamentForm
- **Props**: `{ decks, archetypes, onSave, onClose }`
- **Hace**: crear torneo (seleccionar mazo, número de rondas). Para cada ronda: seleccionar arquetipo rival y marcar resultados (círculos verde/rojo). Valida que cada ronda tenga 2 resultados del mismo tipo antes de guardar.

### TournamentHistory
- **Props**: `{ tournaments, onDelete }`
- **Hace**: lista de torneos pasados con fecha, mazo, resultado global (X-Y) y botón eliminar con confirmación.

### TournamentRound
- **Props**: `{ roundIndex, round, archetypes, onChange }`
- **Hace**: fila de una ronda: selector de arquetipo rival + 2 (o 3) botones de resultado circulares.

---

## Componentes de Matchup (components/matchup/)

### MyMatchupMatrix
- **Props**: `{ games }`
- **Hace**: calcula la matriz solo con partidas del usuario y renderiza MatchupMatrix

### MyMatchupMatrixDetails
- **Props**: `{ user, archetype, onClose }`
- **Hace**: modal con winrate del usuario contra un arquetipo concreto

---

## Componentes compartidos (components/shared/)

### Auth
- **Props**: `{ onClose? }`
- **Hace**: formulario de login + registro con email/password

### Navbar
- **Props**: `{ user, onLogout }`
- **Hace**: barra de navegación con links a todas las rutas. Links privados solo visibles si hay usuario.

### Modal
- **Props**: `{ children, onClose }`
- **Hace**: backdrop + contenedor centrado. Todos los modales del proyecto usan este wrapper.

---

## Hooks (hooks/)

### useDecks(userId)
```
returns: { decks, loading, error, addDeck, updateDeck, deleteDeck }
```
- `deleteDeck` también elimina las partidas asociadas al mazo

### useGames(userId)
```
returns: { games, loading, error, addGame, deleteGame }
```
- Partidas ordenadas por timestamp desc

### useTournaments(userId)
```
returns: { tournaments, loading, error, addTournament, deleteTournament }
```
- `deleteTournament` también elimina las partidas asociadas (por tournamentId)

### useGlobalStats()
```
returns: { games, archetypes, loading, error }
```
- Sin filtro de usuario, lee toda la colección `games`

### useArchetypes()
```
returns: { archetypes, loading, error }
```
- Lista de strings con los nombres de arquetipos de Firestore

---

## AuthContext

```js
// Provee: { user, loading }
// Usado en: App.js (guard de rutas privadas), Navbar, cualquier hook que necesite userId
```

---

## Modelo de datos en Firestore

### games
```js
{
  deckId: string,
  deckName: string,
  archetype: string,
  opponentArchetype: string,
  result: "win" | "loss",
  note: string,           // puede ser ""
  ownerId: string,
  timestamp: Timestamp,
  tournamentId: string | null   // null si es partida suelta
}
```

### decks
```js
{
  name: string,
  archetype: string,
  mainboard: string[],    // ["4 Lightning Bolt", ...]
  sideboard: string[],
  ownerId: string
}
```

### tournaments
```js
{
  name: string,           // opcional, para identificarlo en el historial
  deckId: string,
  deckName: string,
  ownerId: string,
  date: Timestamp,
  gameIds: string[]
}
```

### archetypes
```js
{
  name: string
}
```
