/**
 * AML/CFT Screening Module - Anti-Money Laundering & Counter Financing of Terrorism
 * 
 * Ce module implémente:
 * - Fuzzy matching (Jaro-Winkler) pour les noms africains
 * - Screening contre les listes de sanctions (ONU, OFAC, UEMOA)
 * - Détection des Personnes Politiquement Exposées (PEP)
 * - Hashing anonymisé pour la conformité BCEAO
 */

// =====================================================
// TYPES
// =====================================================

export interface SanctionEntry {
  id: string;
  list_source: 'UN_CONSOLIDATED' | 'OFAC_SDN' | 'EU_SANCTIONS' | 'UEMOA_GEL' | 'BCEAO' | 'LOCAL';
  entry_type: 'individual' | 'entity';
  full_name: string;
  aliases: string[];
  date_of_birth?: string;
  nationality?: string[];
  national_id?: string;
  sanction_type: string[];
  reason?: string;
  listed_on?: string;
  reference_url?: string;
}

export interface ScreeningMatch {
  sanction_entry: SanctionEntry;
  match_score: number;
  match_type: 'exact' | 'fuzzy' | 'alias';
  matched_field: string;
  matched_value: string;
}

export interface ScreeningResult {
  status: 'clear' | 'potential_match' | 'confirmed_match';
  matches: ScreeningMatch[];
  pep_result: PEPResult | null;
  processing_time_ms: number;
  screening_id: string;
}

export interface PEPResult {
  is_pep: boolean;
  category_code: string | null;
  category_name: string | null;
  risk_increase_percent: number;
  matched_keywords: string[];
}

export interface PEPCategory {
  category_code: string;
  category_name: string;
  risk_weight: number;
  keywords: string[];
}

// =====================================================
// JARO-WINKLER SIMILARITY ALGORITHM
// =====================================================

/**
 * Calcule la distance de Jaro entre deux chaînes
 */
function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
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

  // Count transpositions
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
 * Calcule la similarité Jaro-Winkler avec boost de préfixe
 * Optimisé pour les noms africains (préfixes communs)
 */
export function jaroWinklerSimilarity(s1: string, s2: string, prefixScale = 0.1): number {
  const jaroScore = jaroSimilarity(s1, s2);

  // Calculate common prefix (max 4 characters)
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  return jaroScore + prefixLength * prefixScale * (1 - jaroScore);
}

/**
 * Normalise un nom pour la comparaison
 * Gère les variations courantes des noms africains
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  let normalized = name
    .toLowerCase()
    .trim()
    // Supprimer les accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Supprimer les caractères spéciaux
    .replace(/[^a-z\s]/g, '')
    // Normaliser les espaces multiples
    .replace(/\s+/g, ' ');

  // Variations courantes des noms africains
  const variations: Record<string, string> = {
    'oumar': 'omar',
    'mamadou': 'mamadu',
    'amadou': 'amadu',
    'abdoulaye': 'abdulaye',
    'moussa': 'musa',
    'issa': 'isa',
    'seydou': 'seidou',
    'ibrahima': 'ibrahim',
    'ousmane': 'usman',
    'saidou': 'saidu',
    'diallo': 'dialo',
    'traore': 'traor',
    'coulibaly': 'kulibali',
    'kone': 'kon',
    'cisse': 'cis',
    'toure': 'tur',
    'camara': 'kamara',
    'diarra': 'diara',
    'keita': 'keyta',
    'bah': 'ba'
  };

  // Appliquer les normalisations
  const words = normalized.split(' ');
  normalized = words
    .map(word => variations[word] || word)
    .join(' ');

  return normalized;
}

/**
 * Génère un hash SHA-256 anonymisé pour les logs de conformité
 */
export async function hashForCompliance(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  
  // Utiliser SubtleCrypto si disponible (navigateur/Deno)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback simple pour les environnements sans crypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// =====================================================
// LISTES DE SANCTIONS (CACHE LOCAL)
// =====================================================

/**
 * Liste de sanctions UEMOA/Afrique de l'Ouest (exemple)
 * En production, cette liste serait mise à jour quotidiennement
 * depuis les sources officielles (ONU, OFAC, BCEAO)
 */
export const UEMOA_SANCTIONS_LIST: SanctionEntry[] = [
  // Exemples basés sur les listes publiques ONU pour l'Afrique
  {
    id: 'UN-ML-001',
    list_source: 'UN_CONSOLIDATED',
    entry_type: 'individual',
    full_name: 'Example Person One',
    aliases: ['EP One', 'Person Example'],
    nationality: ['ML'],
    sanction_type: ['asset_freeze', 'travel_ban'],
    reason: 'Association with designated groups',
    listed_on: '2020-01-15',
    reference_url: 'https://www.un.org/securitycouncil/sanctions'
  },
  // ... En production, cette liste contiendrait des milliers d'entrées
];

// =====================================================
// CATÉGORIES PEP (Personnes Politiquement Exposées)
// =====================================================

export const PEP_CATEGORIES: PEPCategory[] = [
  {
    category_code: 'HEAD_STATE',
    category_name: 'Chef d\'État / Président',
    risk_weight: 50,
    keywords: ['president', 'chef etat', 'chef de l\'etat', 'premier ministre', 'pm']
  },
  {
    category_code: 'MINISTER',
    category_name: 'Ministre / Secrétaire d\'État',
    risk_weight: 40,
    keywords: ['ministre', 'secretaire etat', 'secretaire d\'etat', 'ministry', 'ministere']
  },
  {
    category_code: 'PARLIAMENT',
    category_name: 'Député / Sénateur',
    risk_weight: 35,
    keywords: ['depute', 'senateur', 'assemblee nationale', 'parlement', 'parlementaire']
  },
  {
    category_code: 'JUDICIARY',
    category_name: 'Magistrat / Juge',
    risk_weight: 35,
    keywords: ['magistrat', 'juge', 'procureur', 'cour supreme', 'cour constitutionnelle', 'tribunal']
  },
  {
    category_code: 'CENTRAL_BANK',
    category_name: 'Dirigeant Banque Centrale',
    risk_weight: 45,
    keywords: ['bceao', 'banque centrale', 'gouverneur bceao', 'gouverneur banque']
  },
  {
    category_code: 'MILITARY',
    category_name: 'Haut Gradé Militaire',
    risk_weight: 40,
    keywords: ['general', 'colonel', 'commandant', 'chef etat major', 'armee', 'forces armees', 'gendarmerie']
  },
  {
    category_code: 'DIPLOMAT',
    category_name: 'Ambassadeur / Diplomate',
    risk_weight: 30,
    keywords: ['ambassadeur', 'consul', 'diplomate', 'affaires etrangeres']
  },
  {
    category_code: 'SOE_DIRECTOR',
    category_name: 'Dirigeant Entreprise Publique',
    risk_weight: 35,
    keywords: ['directeur general', 'dg', 'pca', 'president conseil', 'regie financiere', 'societe d\'etat', 'entreprise publique', 'impots', 'douanes', 'tresor']
  },
  {
    category_code: 'PARTY_LEADER',
    category_name: 'Dirigeant Parti Politique',
    risk_weight: 30,
    keywords: ['president parti', 'secretaire general parti', 'chef parti', 'parti politique']
  },
  {
    category_code: 'INTL_ORG',
    category_name: 'Fonctionnaire Organisation Internationale',
    risk_weight: 25,
    keywords: ['onu', 'nations unies', 'ua', 'union africaine', 'cedeao', 'uemoa', 'bad', 'banque africaine']
  }
];

// =====================================================
// FONCTIONS DE SCREENING
// =====================================================

/**
 * Effectue un screening contre les listes de sanctions
 */
export function screenAgainstSanctions(
  fullName: string,
  dateOfBirth?: string,
  nationalId?: string,
  sanctionsList: SanctionEntry[] = UEMOA_SANCTIONS_LIST,
  matchThreshold = 0.85
): ScreeningMatch[] {
  const normalizedName = normalizeName(fullName);
  const matches: ScreeningMatch[] = [];

  for (const entry of sanctionsList) {
    // Vérifier le nom principal
    const normalizedEntryName = normalizeName(entry.full_name);
    const nameScore = jaroWinklerSimilarity(normalizedName, normalizedEntryName);

    if (nameScore >= matchThreshold) {
      matches.push({
        sanction_entry: entry,
        match_score: nameScore,
        match_type: nameScore === 1.0 ? 'exact' : 'fuzzy',
        matched_field: 'full_name',
        matched_value: entry.full_name
      });
      continue;
    }

    // Vérifier les alias
    for (const alias of entry.aliases || []) {
      const normalizedAlias = normalizeName(alias);
      const aliasScore = jaroWinklerSimilarity(normalizedName, normalizedAlias);

      if (aliasScore >= matchThreshold) {
        matches.push({
          sanction_entry: entry,
          match_score: aliasScore,
          match_type: 'alias',
          matched_field: 'alias',
          matched_value: alias
        });
        break;
      }
    }

    // Vérifier le numéro d'identité si disponible
    if (nationalId && entry.national_id) {
      const idNormalized = nationalId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const entryIdNormalized = entry.national_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      if (idNormalized === entryIdNormalized) {
        matches.push({
          sanction_entry: entry,
          match_score: 1.0,
          match_type: 'exact',
          matched_field: 'national_id',
          matched_value: entry.national_id
        });
      }
    }
  }

  // Trier par score décroissant
  return matches.sort((a, b) => b.match_score - a.match_score);
}

/**
 * Détecte si une personne est un PEP basé sur son emploi déclaré
 */
export function detectPEP(
  occupation?: string,
  employer?: string,
  categories: PEPCategory[] = PEP_CATEGORIES
): PEPResult {
  if (!occupation && !employer) {
    return {
      is_pep: false,
      category_code: null,
      category_name: null,
      risk_increase_percent: 0,
      matched_keywords: []
    };
  }

  const normalizedOccupation = normalizeName(occupation || '');
  const normalizedEmployer = normalizeName(employer || '');
  const combinedText = `${normalizedOccupation} ${normalizedEmployer}`;

  for (const category of categories) {
    const matchedKeywords: string[] = [];

    for (const keyword of category.keywords) {
      const normalizedKeyword = normalizeName(keyword);
      if (combinedText.includes(normalizedKeyword)) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      return {
        is_pep: true,
        category_code: category.category_code,
        category_name: category.category_name,
        risk_increase_percent: category.risk_weight,
        matched_keywords: matchedKeywords
      };
    }
  }

  return {
    is_pep: false,
    category_code: null,
    category_name: null,
    risk_increase_percent: 0,
    matched_keywords: []
  };
}

/**
 * Effectue un screening complet (sanctions + PEP)
 */
export async function performFullScreening(
  fullName: string,
  dateOfBirth?: string,
  nationalId?: string,
  occupation?: string,
  employer?: string,
  sanctionsList?: SanctionEntry[]
): Promise<ScreeningResult> {
  const startTime = performance.now();

  // Screening sanctions
  const sanctionMatches = screenAgainstSanctions(
    fullName,
    dateOfBirth,
    nationalId,
    sanctionsList
  );

  // Détection PEP
  const pepResult = detectPEP(occupation, employer);

  // Déterminer le statut
  let status: ScreeningResult['status'] = 'clear';
  if (sanctionMatches.length > 0) {
    const maxScore = Math.max(...sanctionMatches.map(m => m.match_score));
    status = maxScore >= 0.95 ? 'confirmed_match' : 'potential_match';
  }

  const processingTime = Math.round(performance.now() - startTime);

  return {
    status,
    matches: sanctionMatches,
    pep_result: pepResult,
    processing_time_ms: processingTime,
    screening_id: `scr_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Calcule le score de risque AML ajusté
 */
export function calculateAMLAdjustedRiskScore(
  baseRiskScore: number,
  screeningResult: ScreeningResult
): {
  adjusted_score: number;
  adjustments: { reason: string; delta: number }[];
} {
  let adjustedScore = baseRiskScore;
  const adjustments: { reason: string; delta: number }[] = [];

  // Ajustement pour correspondance sanctions
  if (screeningResult.status === 'confirmed_match') {
    const delta = 50;
    adjustedScore += delta;
    adjustments.push({
      reason: 'Correspondance confirmée liste de sanctions',
      delta
    });
  } else if (screeningResult.status === 'potential_match') {
    const delta = 30;
    adjustedScore += delta;
    adjustments.push({
      reason: 'Correspondance potentielle liste de sanctions',
      delta
    });
  }

  // Ajustement PEP
  if (screeningResult.pep_result?.is_pep) {
    const delta = screeningResult.pep_result.risk_increase_percent;
    adjustedScore += delta;
    adjustments.push({
      reason: `PEP détecté: ${screeningResult.pep_result.category_name}`,
      delta
    });
  }

  return {
    adjusted_score: Math.min(adjustedScore, 100),
    adjustments
  };
}
