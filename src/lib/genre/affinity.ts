// src/lib/genre/affinity.ts
import { Genre } from '../../types/track';

// Base genre affinity table (symmetric or directed affinities scaled 0 to 100)
const GENRE_AFFINITY_MATRIX: Record<string, Record<string, number>> = {
  Techno: {
    Techno: 100,
    Electro: 80,
    'Breaks / UK Bass': 75,
    'IDM / Experimental': 65,
    House: 70,
    'Ambient / Downtempo': 40,
    'Disco / Indie Dance': 45,
    Rock: 15,
    Pop: 10,
    'Soul / R&B': 10,
    'Hip-Hop': 25,
    'Jazz / Fusion': 20,
    Folk: 5,
    Other: 30,
  },
  House: {
    House: 100,
    'Disco / Indie Dance': 85,
    Techno: 70,
    Electro: 65,
    'Soul / R&B': 70,
    'Breaks / UK Bass': 60,
    'Hip-Hop': 45,
    'Jazz / Fusion': 50,
    'IDM / Experimental': 40,
    'Ambient / Downtempo': 35,
    Pop: 40,
    Rock: 20,
    Folk: 10,
    Other: 30,
  },
  Electro: {
    Electro: 100,
    Techno: 80,
    'Breaks / UK Bass': 85,
    'IDM / Experimental': 75,
    House: 65,
    'Hip-Hop': 55,
    'Disco / Indie Dance': 60,
    'Ambient / Downtempo': 40,
    Rock: 20,
    Pop: 25,
    'Soul / R&B': 20,
    'Jazz / Fusion': 25,
    Folk: 5,
    Other: 35,
  },
  'Breaks / UK Bass': {
    'Breaks / UK Bass': 100,
    Electro: 85,
    Techno: 75,
    'IDM / Experimental': 75,
    House: 60,
    'Hip-Hop': 65,
    'Ambient / Downtempo': 45,
    'Disco / Indie Dance': 45,
    'Jazz / Fusion': 40,
    'Soul / R&B': 30,
    Rock: 20,
    Pop: 20,
    Folk: 5,
    Other: 35,
  },
  'IDM / Experimental': {
    'IDM / Experimental': 100,
    Electro: 75,
    'Breaks / UK Bass': 75,
    Techno: 65,
    'Ambient / Downtempo': 80,
    House: 40,
    'Jazz / Fusion': 50,
    Rock: 30,
    'Hip-Hop': 40,
    'Disco / Indie Dance': 35,
    Pop: 15,
    'Soul / R&B': 20,
    Folk: 15,
    Other: 40,
  },
  'Disco / Indie Dance': {
    'Disco / Indie Dance': 100,
    House: 85,
    'Soul / R&B': 75,
    Electro: 60,
    Techno: 45,
    Pop: 60,
    Rock: 40,
    'Breaks / UK Bass': 45,
    'Hip-Hop': 50,
    'Jazz / Fusion': 55,
    'Ambient / Downtempo': 35,
    'IDM / Experimental': 30,
    Folk: 15,
    Other: 35,
  },
  'Ambient / Downtempo': {
    'Ambient / Downtempo': 100,
    'IDM / Experimental': 80,
    'Jazz / Fusion': 60,
    Techno: 40,
    House: 35,
    Electro: 40,
    'Breaks / UK Bass': 45,
    'Soul / R&B': 45,
    Folk: 35,
    Rock: 25,
    Pop: 25,
    'Hip-Hop': 40,
    'Disco / Indie Dance': 30,
    Other: 40,
  },
};

export interface GenreCompatibilityResult {
  score: number; // 0 to 100
  reason: string;
  matchedTags: string[];
}

/**
 * Calculates genre compatibility based on structured Genre and secondary Tags.
 */
export function calculateGenreCompatibility(
  sourceGenre: Genre | string,
  targetGenre: Genre | string,
  sourceTags: string[] = [],
  targetTags: string[] = []
): GenreCompatibilityResult {
  const normSource = (sourceGenre || 'Other').trim();
  const normTarget = (targetGenre || 'Other').trim();

  let baseScore = 30; // default for unknown genres

  if (normSource.toLowerCase() === normTarget.toLowerCase()) {
    baseScore = 100;
  } else if (GENRE_AFFINITY_MATRIX[normSource]?.[normTarget] !== undefined) {
    baseScore = GENRE_AFFINITY_MATRIX[normSource][normTarget];
  } else if (GENRE_AFFINITY_MATRIX[normTarget]?.[normSource] !== undefined) {
    baseScore = GENRE_AFFINITY_MATRIX[normTarget][normSource];
  }

  // Secondary evaluation: check shared or complementary tags
  const cleanSourceTags = sourceTags.map(t => t.toLowerCase().trim()).filter(Boolean);
  const cleanTargetTags = targetTags.map(t => t.toLowerCase().trim()).filter(Boolean);

  const matchedTags: string[] = [];
  for (const sTag of cleanSourceTags) {
    if (cleanTargetTags.includes(sTag) && !matchedTags.includes(sTag)) {
      matchedTags.push(sTag);
    }
  }

  // Tag boost: up to +15 points if genres differ but tags match closely
  let tagBoost = 0;
  if (matchedTags.length > 0 && baseScore < 100) {
    tagBoost = Math.min(15, matchedTags.length * 8);
  }

  const finalScore = Math.min(100, baseScore + tagBoost);

  let reason = '';
  if (normSource.toLowerCase() === normTarget.toLowerCase()) {
    reason = `Mismo género (${normTarget})`;
    if (matchedTags.length > 0) {
      reason += ` y tags compartidos (${matchedTags.slice(0, 2).join(', ')})`;
    }
  } else if (finalScore >= 75) {
    reason = `Afinidad estilística alta entre ${normSource} y ${normTarget}`;
    if (matchedTags.length > 0) {
      reason += ` (tags: ${matchedTags.join(', ')})`;
    }
  } else if (finalScore >= 50) {
    reason = `Afinidad moderada con ${normTarget}`;
  } else {
    reason = `Géneros distantes (${normSource} vs ${normTarget})`;
  }

  return {
    score: finalScore,
    reason,
    matchedTags,
  };
}
