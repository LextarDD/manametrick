// src/components/matchup/MyMatchupMatrix.js
import React, { useState } from 'react';
import MatchupMatrix from '../stats/MatchupMatrix';
import MyMatchupMatrixDetails from './MyMatchupMatrixDetails';

const MyMatchupMatrix = ({ games, user }) => {
  const [selectedCell, setSelectedCell] = useState(null);

  if (!games || games.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.4 }}>⚔</div>
        <p>No hay partidas registradas aún.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.7 }}>
          Registra partidas para ver tu matriz de matchups personal.
        </p>
      </div>
    );
  }

  // Acumular partidas agrupando siempre en el mismo sentido: clave canónica A < B
  // Para la celda [playerArch][oppArch]:
  //   - Si archetype=Burn, opponent=WW → cuenta como Burn vs WW (win = win)
  //   - Si archetype=WW, opponent=Burn → cuenta como Burn vs WW (win = loss para Burn)
  // Así ambas perspectivas alimentan la misma celda y la matriz es simétrica.

  const pairMap = {}; // pairMap[A][B] = { wins: wins de A, total }  donde A < B canónicamente

  for (const game of games) {
    const a = game.archetype;
    const b = game.opponent_archetype;
    if (!a || !b || a === b) continue;

    // Orden canónico
    const [key1, key2] = a < b ? [a, b] : [b, a];
    const isCanonical = a === key1; // la partida está registrada en el sentido canónico

    if (!pairMap[key1]) pairMap[key1] = {};
    if (!pairMap[key1][key2]) pairMap[key1][key2] = { wins: 0, total: 0 };

    pairMap[key1][key2].total += 1;
    // Si está en sentido canónico, win = win de key1
    // Si está invertido, win de b (=key1) es cuando el resultado es 'loss'
    const isWinForKey1 = isCanonical ? game.result === 'win' : game.result === 'loss';
    if (isWinForKey1) pairMap[key1][key2].wins += 1;
  }

  // Construir archetypeList con todos los arquetipos que aparecen
  const archetypeSet = new Set();
  for (const game of games) {
    if (game.archetype) archetypeSet.add(game.archetype);
    if (game.opponent_archetype) archetypeSet.add(game.opponent_archetype);
  }
  const archetypeList = Array.from(archetypeSet).sort((a, b) => a.localeCompare(b));

  // Construir matrix objeto anidado con simetría:
  // matrix[A][B] = winrate de A contra B
  // matrix[B][A] = 100 - matrix[A][B]  (simétrico)
  const matrix = {};
  for (const arch of archetypeList) matrix[arch] = {};

  for (const key1 of Object.keys(pairMap)) {
    for (const key2 of Object.keys(pairMap[key1])) {
      const { wins, total } = pairMap[key1][key2];
      if (total === 0) continue;

      const wrKey1 = Math.round((wins / total) * 1000) / 10;
      const wrKey2 = Math.round(((total - wins) / total) * 1000) / 10;

      matrix[key1][key2] = { wins, total, winrate: wrKey1 };
      matrix[key2][key1] = { wins: total - wins, total, winrate: wrKey2 };
    }
  }

  const handleSelectArchetype = (playerArch, oppArch) => {
    if (!oppArch) return;
    setSelectedCell({ playerArch, oppArch });
  };

  return (
    <>
      <MatchupMatrix
        matrix={matrix}
        archetypeList={archetypeList}
        onSelectArchetype={handleSelectArchetype}
      />

      {selectedCell && (
        <MyMatchupMatrixDetails
          user={user}
          playerArch={selectedCell.playerArch}
          oppArch={selectedCell.oppArch}
          games={games}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </>
  );
};

export default MyMatchupMatrix;