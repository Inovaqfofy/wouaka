/**
 * WOUAKA Name Matcher
 * Jaro-Winkler algorithm for African name matching
 */

/**
 * Calculate Jaro similarity between two strings
 */
function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3
  );
}

/**
 * Calculate Jaro-Winkler similarity (boosted for common prefix)
 */
export function jaroWinklerSimilarity(s1: string, s2: string, prefixScale = 0.1): number {
  const jaroScore = jaroSimilarity(s1, s2);
  
  // Calculate common prefix (max 4 chars)
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  return jaroScore + prefix * prefixScale * (1 - jaroScore);
}

/**
 * African name preprocessing
 * - Handles common particles (de, du, el, al, ben, ibn)
 * - Normalizes accents and special characters
 * - Handles compound names
 */
export function normalizeAfricanName(name: string): string {
  let normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[''`]/g, ' ') // Replace apostrophes with space
    .replace(/[-–—]/g, ' ') // Replace hyphens with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Common title removal
  const titles = [
    'mr', 'mme', 'mlle', 'dr', 'pr', 'prof', 'el hadj', 'el hadji', 'hadj', 'hadji',
    'maître', 'maitre', 'cheikh', 'imam', 'pasteur', 'pere', 'soeur', 'frere'
  ];
  
  for (const title of titles) {
    if (normalized.startsWith(title + ' ')) {
      normalized = normalized.substring(title.length + 1);
    }
  }

  return normalized;
}

/**
 * Extract name parts for flexible matching
 */
export function extractNameParts(name: string): string[] {
  const normalized = normalizeAfricanName(name);
  
  // Split and filter out particles
  const particles = ['de', 'du', 'des', 'le', 'la', 'les', 'el', 'al', 'ben', 'ibn', 'bint', 'ould', 'dit'];
  const parts = normalized.split(' ').filter(p => p.length > 1 && !particles.includes(p));
  
  return parts;
}

/**
 * Match two names with African name sensitivity
 * Returns a score from 0 to 100
 */
export function matchAfricanNames(
  name1: string,
  name2: string
): { score: number; confidence: string; details: string[] } {
  const parts1 = extractNameParts(name1);
  const parts2 = extractNameParts(name2);

  if (parts1.length === 0 || parts2.length === 0) {
    return { score: 0, confidence: 'none', details: ['Un ou plusieurs noms vides'] };
  }

  const details: string[] = [];
  let totalScore = 0;
  let matchCount = 0;

  // Strategy 1: Full name comparison
  const fullName1 = parts1.join(' ');
  const fullName2 = parts2.join(' ');
  const fullMatch = jaroWinklerSimilarity(fullName1, fullName2);
  details.push(`Correspondance globale: ${Math.round(fullMatch * 100)}%`);

  // Strategy 2: Part-by-part best match
  const usedParts2: Set<number> = new Set();
  
  for (const part1 of parts1) {
    let bestScore = 0;
    let bestIndex = -1;
    
    for (let j = 0; j < parts2.length; j++) {
      if (usedParts2.has(j)) continue;
      const score = jaroWinklerSimilarity(part1, parts2[j]);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = j;
      }
    }
    
    if (bestIndex >= 0 && bestScore > 0.7) {
      usedParts2.add(bestIndex);
      totalScore += bestScore;
      matchCount++;
      
      if (bestScore > 0.9) {
        details.push(`"${part1}" ≈ "${parts2[bestIndex]}" (${Math.round(bestScore * 100)}%)`);
      }
    }
  }

  // Calculate final score
  const partsRatio = matchCount / Math.max(parts1.length, parts2.length);
  const avgPartScore = matchCount > 0 ? totalScore / matchCount : 0;
  
  // Weighted combination
  const finalScore = Math.round(
    (fullMatch * 0.4 + avgPartScore * 0.4 + partsRatio * 0.2) * 100
  );

  // Confidence level
  let confidence: string;
  if (finalScore >= 90) {
    confidence = 'high';
  } else if (finalScore >= 75) {
    confidence = 'medium';
  } else if (finalScore >= 60) {
    confidence = 'low';
  } else {
    confidence = 'none';
  }

  // Additional details
  if (parts1.length !== parts2.length) {
    details.push(`Parties différentes: ${parts1.length} vs ${parts2.length}`);
  }

  return { score: finalScore, confidence, details };
}

/**
 * Check if names are likely the same person
 */
export function areNamesSamePerson(name1: string, name2: string, threshold = 85): boolean {
  const result = matchAfricanNames(name1, name2);
  return result.score >= threshold;
}
