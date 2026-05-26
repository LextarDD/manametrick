# ManaMetrick — Project Context

## ¿Qué es?
ManaMetrick es una aplicación web para jugadores de Magic: The Gathering en formato **Pauper**.
Permite registrar mazos, partidas y torneos, y visualizar estadísticas de rendimiento propias y globales de la comunidad.

## Usuarios
- Registro abierto a cualquier jugador
- Autenticación con email y contraseña (Supabase Auth)
- Contenido público: estadísticas globales y página de arquetipo (sin login)
- Contenido privado: mazos, partidas, torneos y stats personales (requiere login)

## Formato soportado
- Solo **Pauper**
- Los mazos se validan contra la API de Scryfall

## Problema que resuelve
Los jugadores de Pauper no tienen una herramienta dedicada para trackear su winrate por arquetipo, ver el meta global de su comunidad y analizar sus partidas a lo largo del tiempo.

## API externa
- **Scryfall API**: validación de cartas y obtención de imágenes
  - Endpoint de búsqueda fuzzy: `https://api.scryfall.com/cards/named?fuzzy={nombre}`
  - Imagen: `data.image_uris.normal`

## Base de datos (Supabase — PostgreSQL)
Tablas:
- `archetypes` — arquetipos del meta Pauper
- `decks` — mazos de usuarios
- `games` — partidas individuales
- `tournaments` — torneos registrados
- `tournament_games` — relación torneo ↔ partidas

Las stats globales se calculan con queries SQL en Supabase, no en el cliente.

## Lo que NO hace
- No es un deck builder visual (no hay búsqueda de cartas, drag & drop, etc.)
- No soporta otros formatos además de Pauper
- No tiene funcionalidad social (chat, follows, etc.)
- No tiene Gran Torneo (feature eliminada)
