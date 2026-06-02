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

  // 1 game en BD = 1 ronda completa. Contar rondas directamente.
  const pairMap = {};

  for (const game of games) {
    const a = game.archetype;
    const b = game.opponent_archetype;
    if (!a || !b || a === b) continue;

    const [key1, key2] = a < b ? [a, b] : [b, a];
    const isCanonical = a === key1;

    if (!pairMap[key1]) pairMap[key1] = {};
    if (!pairMap[key1][key2]) pairMap[key1][key2] = { wins: 0, losses: 0, draws: 0, total: 0 };

    pairMap[key1][key2].total += 1;

    if (game.result === 'draw' || game.score === '1-1') {
      pairMap[key1][key2].draws += 1;
    } else {
      const isWinForKey1 = isCanonical ? game.result === 'win' : game.result === 'loss';
      if (isWinForKey1) pairMap[key1][key2].wins += 1;
      else              pairMap[key1][key2].losses += 1;
    }
  }

  const archetypeSet = new Set();
  for (const game of games) {
    if (game.archetype) archetypeSet.add(game.archetype);
    if (game.opponent_archetype) archetypeSet.add(game.opponent_archetype);
  }
  const archetypeList = Array.from(archetypeSet).sort((a, b) => a.localeCompare(b));

  const matrix = {};
  for (const arch of archetypeList) matrix[arch] = {};

  for (const key1 of Object.keys(pairMap)) {
    for (const key2 of Object.keys(pairMap[key1])) {
      const { wins, losses, draws, total } = pairMap[key1][key2];
      if (total === 0) continue;

      // El winrate solo se calcula sobre partidas decididas (sin empates)
      const decided = wins + losses;
      const wrKey1 = decided > 0 ? Math.round((wins  / decided) * 1000) / 10 : null;
      const wrKey2 = decided > 0 ? Math.round((losses / decided) * 1000) / 10 : null;

      matrix[key1][key2] = { wins,          losses,        draws, total, winrate: wrKey1 };
      matrix[key2][key1] = { wins: losses,  losses: wins,  draws, total, winrate: wrKey2 };
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