/**
 * Cross-validation module for data consistency checks
 * No external dependencies - pure TypeScript logic
 */

export interface CrossValidationInput {
  // Declared data
  declaredName?: string;
  declaredBirthDate?: string;
  declaredCity?: string;
  declaredPhone?: string;
  declaredRccm?: string;
  declaredYearsInBusiness?: number;
  declaredMonthlyIncome?: number;
  declaredSector?: string;
  
  // Extracted data (from OCR)
  extractedName?: string;
  extractedBirthDate?: string;
  extractedDocumentNumber?: string;
  extractedExpiryDate?: string;
  
  // Verified data (from scraping)
  verifiedCompanyName?: string;
  verifiedRegistrationDate?: string;
  
  // Behavioral signals
  userTimezone?: string;
}

export interface CrossValidationResult {
  overallScore: number; // 0-100
  isValid: boolean;
  validations: {
    nameConsistency: ValidationCheck;
    ageConsistency: ValidationCheck;
    locationConsistency: ValidationCheck;
    documentRecency: ValidationCheck;
    businessTimelineLogic: ValidationCheck;
    incomeReasonability: ValidationCheck;
  };
  flags: string[];
}

interface ValidationCheck {
  passed: boolean;
  confidence: number;
  details?: string;
}

// Phone prefixes by country/city in West Africa
const PHONE_PREFIXES: Record<string, string[]> = {
  'Côte d\'Ivoire': ['225'],
  'Abidjan': ['07', '05', '01'],
  'Sénégal': ['221'],
  'Dakar': ['77', '78', '76'],
  'Mali': ['223'],
  'Bamako': ['66', '76'],
  'Burkina Faso': ['226'],
  'Ouagadougou': ['70', '71'],
};

// Average income ranges by sector (in XOF)
const INCOME_RANGES: Record<string, { min: number; max: number }> = {
  'commerce': { min: 50000, max: 5000000 },
  'agriculture': { min: 30000, max: 2000000 },
  'services': { min: 75000, max: 3000000 },
  'tech': { min: 150000, max: 10000000 },
  'artisanat': { min: 30000, max: 1000000 },
  'transport': { min: 50000, max: 2000000 },
  'restauration': { min: 40000, max: 1500000 },
  'default': { min: 30000, max: 5000000 },
};

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  // Simple word overlap for names
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  
  // Try ISO format
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // Try DD/MM/YYYY format
  const parts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (parts) {
    const day = parseInt(parts[1]);
    const month = parseInt(parts[2]) - 1;
    let year = parseInt(parts[3]);
    if (year < 100) year += 2000;
    date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Main cross-validation function
 */
export function validateCrossData(input: CrossValidationInput): CrossValidationResult {
  const flags: string[] = [];
  const validations: CrossValidationResult['validations'] = {
    nameConsistency: { passed: true, confidence: 100 },
    ageConsistency: { passed: true, confidence: 100 },
    locationConsistency: { passed: true, confidence: 100 },
    documentRecency: { passed: true, confidence: 100 },
    businessTimelineLogic: { passed: true, confidence: 100 },
    incomeReasonability: { passed: true, confidence: 100 },
  };

  // 1. Name consistency check
  if (input.declaredName && input.extractedName) {
    const similarity = stringSimilarity(input.declaredName, input.extractedName);
    validations.nameConsistency = {
      passed: similarity >= 0.6,
      confidence: Math.round(similarity * 100),
      details: similarity < 0.6 
        ? `Nom déclaré "${input.declaredName}" différent du nom extrait "${input.extractedName}"`
        : undefined,
    };
    if (!validations.nameConsistency.passed) {
      flags.push('Incohérence nom déclaré/document');
    }
  }

  // 2. Age consistency check
  if (input.declaredBirthDate || input.extractedBirthDate) {
    const birthDate = parseDate(input.extractedBirthDate || input.declaredBirthDate);
    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age < 18 || age > 90) {
        validations.ageConsistency = {
          passed: false,
          confidence: 100,
          details: `Âge calculé (${age} ans) hors limites acceptables`,
        };
        flags.push('Âge suspect');
      }
    }
  }

  // 3. Location/phone consistency
  if (input.declaredCity && input.declaredPhone) {
    const cityPrefixes = PHONE_PREFIXES[input.declaredCity] || [];
    const phonePrefix = input.declaredPhone.replace(/\D/g, '').substring(0, 2);
    
    if (cityPrefixes.length > 0 && !cityPrefixes.includes(phonePrefix)) {
      validations.locationConsistency = {
        passed: false,
        confidence: 70,
        details: `Indicatif téléphone ne correspond pas à ${input.declaredCity}`,
      };
      flags.push('Incohérence téléphone/ville');
    }
  }

  // 4. Document recency check
  if (input.extractedExpiryDate) {
    const expiryDate = parseDate(input.extractedExpiryDate);
    if (expiryDate && expiryDate < new Date()) {
      validations.documentRecency = {
        passed: false,
        confidence: 100,
        details: 'Document expiré',
      };
      flags.push('Document expiré');
    }
  }

  // 5. Business timeline logic
  if (input.declaredYearsInBusiness !== undefined && input.verifiedRegistrationDate) {
    const regDate = parseDate(input.verifiedRegistrationDate);
    if (regDate) {
      const yearsFromReg = (Date.now() - regDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const difference = Math.abs(yearsFromReg - input.declaredYearsInBusiness);
      
      if (difference > 2) {
        validations.businessTimelineLogic = {
          passed: false,
          confidence: 80,
          details: `Années déclarées (${input.declaredYearsInBusiness}) incohérentes avec date d'enregistrement`,
        };
        flags.push('Incohérence années d\'activité');
      }
    }
  }

  // 6. Income reasonability
  if (input.declaredMonthlyIncome && input.declaredSector) {
    const range = INCOME_RANGES[input.declaredSector.toLowerCase()] || INCOME_RANGES['default'];
    if (input.declaredMonthlyIncome < range.min * 0.5 || input.declaredMonthlyIncome > range.max * 2) {
      validations.incomeReasonability = {
        passed: false,
        confidence: 60,
        details: `Revenu déclaré (${input.declaredMonthlyIncome} XOF) atypique pour le secteur ${input.declaredSector}`,
      };
      flags.push('Revenu atypique pour le secteur');
    }
  }

  // Calculate overall score
  const checks = Object.values(validations);
  const passedCount = checks.filter(c => c.passed).length;
  const avgConfidence = checks.reduce((sum, c) => sum + c.confidence, 0) / checks.length;
  const overallScore = Math.round((passedCount / checks.length) * avgConfidence);

  return {
    overallScore,
    isValid: passedCount >= 4 && overallScore >= 60,
    validations,
    flags,
  };
}
