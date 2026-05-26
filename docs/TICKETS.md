# ManaMetrick — Tickets de trabajo

Orden recomendado de desarrollo. Cada ticket es una sesión de trabajo con Claude.
Al iniciar cada sesión pega: PROJECT.md + ARCHITECTURE.md + el ticket correspondiente.
Si el ticket toca componentes específicos, añade también la sección relevante de COMPONENTS.md.

---

## TICKET-00 — Setup Supabase: tablas, RLS y vistas

**Objetivo**: crear toda la estructura de base de datos en Supabase antes de escribir código React.

**Lo que hay que ejecutar en el SQL Editor de Supabase:**
1. Crear tablas: `archetypes`, `decks`, `games`, `tournaments`
2. Activar RLS en todas las tablas
3. Crear políticas RLS (SELECT/INSERT/UPDATE/DELETE por `user_id`)
4. Crear vistas: `archetype_stats`, `matchup_matrix`
5. Dar SELECT público a las vistas

**Resultado**: Claude genera el SQL completo listo para pegar en Supabase.

**Archivos a crear en el proyecto**:
- `.env` (con variables REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY)
- `src/lib/supabaseClient.js`

---

## TICKET-01 — Setup base: React Router + AuthContext + Navbar

**Objetivo**: reemplazar navegación por booleanos con React Router v6 y AuthContext global con Supabase Auth.

**Archivos a crear**:
- `src/AuthContext.js`
- `src/App.js` (reescribir)
- `src/components/shared/Navbar.js`
- `src/components/shared/Modal.js`
- `src/components/shared/Auth.js` (migrar de Firebase a Supabase)
- `src/pages/HomePage.js` (placeholder)
- `src/pages/MyDecksPage.js` (placeholder)
- `src/pages/MyStatsPage.js` (placeholder)
- `src/pages/MyMatchupPage.js` (placeholder)
- `src/pages/GameHistoryPage.js` (placeholder)
- `src/pages/ArchetypePage.js` (placeholder)

**Archivos a eliminar**:
- `src/components/GranTorneo.js`
- `src/components/GranTorneo2.js`
- `src/components/GranTorneo3.js`
- `src/components/GranTorneo5.js`
- `src/components/DeckList2.js`
- `src/components/AddGame.js`
- `src/components/GameList.js`
- `src/firebaseConfig.js`

**Criterio de éxito**: la app navega con URL, el botón atrás funciona, rutas privadas redirigen a `/` sin sesión.

---

## TICKET-02 — Hook useDecks + useArchetypes + MyDecksPage

**Objetivo**: extraer lógica de mazos a hooks con Supabase y construir MyDecksPage.

**Archivos a crear**:
- `src/hooks/useArchetypes.js`
- `src/hooks/useDecks.js`
- `src/components/deck/AddDeck.js`
- `src/components/deck/DeckList.js`
- `src/components/deck/DeckCard.js`
- `src/components/deck/EditDeckModal.js` (mejorar: añadir cartas nuevas)
- `src/pages/MyDecksPage.js` (completar)

**Criterio de éxito**: añadir, ver, editar (incluyendo añadir cartas nuevas) y eliminar mazos. Eliminar mazo borra sus partidas (CASCADE en Supabase).

---

## TICKET-03 — DeckViewer: grid de imágenes por tipo

**Objetivo**: visualización de mazos con imágenes de Scryfall agrupadas por tipo.

**Archivos a crear**:
- `src/components/deck/DeckViewer.js`

**Archivos a modificar**:
- `src/components/deck/DeckCard.js`

**Criterio de éxito**: grid de imágenes agrupadas por tipo (criaturas, conjuros, instantáneos, encantamientos, artefactos, tierras) con coste de maná total. Fallback a lista de texto si Scryfall falla.

---

## TICKET-04 — Hook useGames + GameHistoryPage + AddGameModal

**Objetivo**: historial de partidas visible y registro de partidas sueltas.

**Archivos a crear**:
- `src/hooks/useGames.js`
- `src/components/games/GameHistory.js`
- `src/components/games/AddGameModal.js`
- `src/components/games/GameFilters.js`
- `src/pages/GameHistoryPage.js` (completar)

**Criterio de éxito**: ver partidas ordenadas por fecha, filtrar por mazo y fechas, añadir partida suelta con nota opcional.

---

## TICKET-05 — Hook useTournaments + TournamentForm + TournamentHistory

**Objetivo**: registro de torneos mejorado con historial y opción de eliminar.

**Archivos a crear**:
- `src/hooks/useTournaments.js`
- `src/components/tournament/TournamentForm.js`
- `src/components/tournament/TournamentHistory.js`
- `src/components/tournament/TournamentRound.js`

**Archivos a modificar**:
- `src/pages/MyStatsPage.js`

**Criterio de éxito**: crear torneo, ver historial con resultado (X-Y), eliminar torneo y sus partidas.

---

## TICKET-06 — Hook useGlobalStats + HomePage pública

**Objetivo**: página pública con stats globales calculadas en Supabase (vistas SQL).

**Archivos a crear**:
- `src/hooks/useGlobalStats.js`
- `src/components/stats/GlobalStats.js`
- `src/components/stats/MatchupMatrix.js`
- `src/components/stats/ArchetypeDetails.js`
- `src/pages/HomePage.js` (completar)

**Criterio de éxito**: visitante sin login ve winrate por arquetipo, top 8 y matchup matrix. Los cálculos vienen de las vistas SQL, no del cliente.

---

## TICKET-07 — ArchetypePage pública

**Objetivo**: página pública de arquetipo con URL compartible.

**Archivos a crear/completar**:
- `src/pages/ArchetypePage.js`

**Archivos a modificar**:
- `src/components/stats/GlobalStats.js` (nombres como links)

**Criterio de éxito**: `/archetype/Burn` muestra winrate y matchups del arquetipo. Funciona sin login.

---

## TICKET-08 — MyStats con todos los arquetipos + filtros

**Objetivo**: MyStats muestra todos los arquetipos/mazos ordenables con filtros por fecha.

**Archivos a crear**:
- `src/components/stats/MyStats.js`
- `src/components/stats/MyArchetypeDetails.js`

**Archivos a modificar**:
- `src/pages/MyStatsPage.js`

**Criterio de éxito**: ver winrate de todos tus arquetipos y mazos, ordenables, filtrados por fecha.

---

## TICKET-09 — MyMatchupPage personal

**Objetivo**: matchup matrix personal reutilizando MatchupMatrix.

**Archivos a crear**:
- `src/components/matchup/MyMatchupMatrix.js`
- `src/components/matchup/MyMatchupMatrixDetails.js`
- `src/pages/MyMatchupPage.js` (completar)

**Criterio de éxito**: matriz personal filtrada por tus partidas. Clic en celda → modal con detalle.

---

## Notas para cada sesión con Claude

1. Pega siempre `PROJECT.md` + `ARCHITECTURE.md` al inicio
2. Añade solo la sección de `COMPONENTS.md` relevante para el ticket
3. Si vas a modificar un archivo existente, pega su contenido actual
4. Al terminar un ticket, actualiza `COMPONENTS.md` si algo cambió
5. Un ticket = una conversación. Si se alarga mucho, parte el ticket en dos.
6. Empieza siempre por TICKET-00 (base de datos) antes de tocar React
