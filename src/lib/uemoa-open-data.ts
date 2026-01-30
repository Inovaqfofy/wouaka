/**
 * UEMOA Open Data Service
 * Free public data sources for regional economic indicators
 * 
 * Sources:
 * - BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)
 * - World Bank Open Data
 * - African Development Bank
 * - National Statistics Institutes
 */

export interface RegionalIndicator {
  country: string;
  indicator: string;
  value: number;
  year: number;
  source: string;
  confidence: number;
}

export interface EconomicContext {
  country: string;
  gdp_per_capita: number;
  inflation_rate: number;
  unemployment_rate: number;
  poverty_rate: number;
  financial_inclusion_rate: number;
  mobile_money_penetration: number;
  banking_penetration: number;
  risk_adjustment: number; // -10 to +10 score adjustment based on context
  data_year: number;
  sources: string[];
}

// ============================================
// UEMOA REGIONAL ECONOMIC DATA (2023-2024)
// Source: BCEAO, World Bank, IMF estimates
// ============================================

export const UEMOA_ECONOMIC_DATA: Record<string, EconomicContext> = {
  CI: {
    country: 'Côte d\'Ivoire',
    gdp_per_capita: 2579,
    inflation_rate: 4.2,
    unemployment_rate: 3.0,
    poverty_rate: 39.5,
    financial_inclusion_rate: 51.0,
    mobile_money_penetration: 48.0,
    banking_penetration: 22.0,
    risk_adjustment: 2,
    data_year: 2023,
    sources: ['BCEAO', 'World Bank', 'INS-CI'],
  },
  SN: {
    country: 'Sénégal',
    gdp_per_capita: 1637,
    inflation_rate: 5.9,
    unemployment_rate: 6.8,
    poverty_rate: 46.0,
    financial_inclusion_rate: 56.0,
    mobile_money_penetration: 52.0,
    banking_penetration: 18.0,
    risk_adjustment: 1,
    data_year: 2023,
    sources: ['BCEAO', 'World Bank', 'ANSD'],
  },
  ML: {
    country: 'Mali',
    gdp_per_capita: 879,
    inflation_rate: 5.0,
    unemployment_rate: 7.4,
    poverty_rate: 44.0,
    financial_inclusion_rate: 35.0,
    mobile_money_penetration: 38.0,
    banking_penetration: 15.0,
    risk_adjustment: -3,
    data_year: 2023,
    sources: ['BCEAO', 'World Bank', 'INSTAT-Mali'],
  },
  BF: {
    country: 'Burkina Faso',
    gdp_per_capita: 893,
    inflation_rate: 7.1,
    unemployment_rate: 5.3,
    poverty_rate: 41.4,
    financial_inclusion_rate: 32.0,
    mobile_money_penetration: 35.0,
    banking_penetration: 12.0,
    risk_adjustment: -2,
    data_year: 2023,
    sources: ['BCEAO', 'World Bank', 'INSD'],
  },
  TG: {
    country: 'Togo',
    gdp_per_capita: 994,
    inflation_rate: 5.3,
    unemployment_rate: 3.9,
    poverty_rate: 45.5,
    financial_inclusion_rate: 45.0,
    mobile_money_penetration: 47.0,
    banking_penetration: 14.0,
    risk_adjustment: 0,
    data_year: 2023,
    sources: ['BCEAO', 'World Bank', 'INSEED'],
  },
  BJ: {
    country: 'Bénin',
    gdp_per_capita: 1399,
    inflation_rate: 3.8,
    unemployment_rate: 2.4,
    poverty_rate: 38.5,
    financial_inclusion_rate: 42.0,
    mobile_money_penetration: 40.0,
    banking_penetration: 16.0,
    risk_adjustment: 1,
    data_year: 2023,
    sources: ['BCEAO', 'World Bank', 'INSAE'],
  },
  NE: {
    country: 'Niger',
    gdp_per_capita: 595,
    inflation_rate: 4.2,
    unemployment_rate: 0.5,
    poverty_rate: 41.8,
    financial_inclusion_rate: 18.0,
    mobile_money_penetration: 12.0,
    banking_penetration: 8.0,
    risk_adjustment: -4,
    data_year: 2023,
    sources: ['BCEAO', 'World Bank', 'INS-Niger'],
  },
  GW: {
    country: 'Guinée-Bissau',
    gdp_per_capita: 814,
    inflation_rate: 9.4,
    unemployment_rate: 6.2,
    poverty_rate: 67.1,
    financial_inclusion_rate: 15.0,
    mobile_money_penetration: 10.0,
    banking_penetration: 6.0,
    risk_adjustment: -5,
    data_year: 2023,
    sources: ['BCEAO', 'World Bank', 'INE-GB'],
  },
};

// ============================================
// SECTORAL RISK WEIGHTS BY COUNTRY
// ============================================

export interface SectorRisk {
  sector: string;
  risk_level: 'low' | 'medium' | 'high';
  adjustment: number; // Score adjustment
  volatility: number; // 0-100
  formalization_rate: number; // % of formal businesses
}

export const UEMOA_SECTOR_RISKS: Record<string, SectorRisk[]> = {
  CI: [
    { sector: 'agriculture', risk_level: 'medium', adjustment: -2, volatility: 40, formalization_rate: 15 },
    { sector: 'commerce', risk_level: 'medium', adjustment: 0, volatility: 35, formalization_rate: 30 },
    { sector: 'services', risk_level: 'low', adjustment: 2, volatility: 25, formalization_rate: 45 },
    { sector: 'industrie', risk_level: 'low', adjustment: 3, volatility: 30, formalization_rate: 60 },
    { sector: 'transport', risk_level: 'medium', adjustment: -1, volatility: 45, formalization_rate: 20 },
    { sector: 'btp', risk_level: 'medium', adjustment: 1, volatility: 50, formalization_rate: 35 },
    { sector: 'restauration', risk_level: 'high', adjustment: -3, volatility: 55, formalization_rate: 10 },
    { sector: 'artisanat', risk_level: 'high', adjustment: -2, volatility: 45, formalization_rate: 8 },
  ],
  SN: [
    { sector: 'agriculture', risk_level: 'medium', adjustment: -1, volatility: 45, formalization_rate: 10 },
    { sector: 'commerce', risk_level: 'medium', adjustment: 0, volatility: 30, formalization_rate: 25 },
    { sector: 'services', risk_level: 'low', adjustment: 2, volatility: 25, formalization_rate: 40 },
    { sector: 'peche', risk_level: 'high', adjustment: -3, volatility: 60, formalization_rate: 5 },
    { sector: 'transport', risk_level: 'medium', adjustment: -1, volatility: 40, formalization_rate: 15 },
    { sector: 'btp', risk_level: 'medium', adjustment: 1, volatility: 45, formalization_rate: 30 },
    { sector: 'tourisme', risk_level: 'high', adjustment: -2, volatility: 70, formalization_rate: 20 },
    { sector: 'artisanat', risk_level: 'high', adjustment: -2, volatility: 50, formalization_rate: 5 },
  ],
};

// Default sector risks for countries not specifically mapped
export const DEFAULT_SECTOR_RISKS: SectorRisk[] = [
  { sector: 'agriculture', risk_level: 'high', adjustment: -3, volatility: 50, formalization_rate: 10 },
  { sector: 'commerce', risk_level: 'medium', adjustment: 0, volatility: 35, formalization_rate: 20 },
  { sector: 'services', risk_level: 'medium', adjustment: 1, volatility: 30, formalization_rate: 30 },
  { sector: 'transport', risk_level: 'medium', adjustment: -1, volatility: 45, formalization_rate: 15 },
  { sector: 'artisanat', risk_level: 'high', adjustment: -2, volatility: 45, formalization_rate: 5 },
];

// ============================================
// REGIONAL CITY RISK DATA
// ============================================

export interface CityRisk {
  city: string;
  region: string;
  population_density: 'low' | 'medium' | 'high';
  economic_activity: 'low' | 'medium' | 'high';
  infrastructure_quality: 'poor' | 'moderate' | 'good';
  risk_adjustment: number;
}

export const UEMOA_CITY_RISKS: Record<string, CityRisk[]> = {
  CI: [
    { city: 'Abidjan', region: 'Lagunes', population_density: 'high', economic_activity: 'high', infrastructure_quality: 'good', risk_adjustment: 3 },
    { city: 'Bouaké', region: 'Vallée du Bandama', population_density: 'medium', economic_activity: 'medium', infrastructure_quality: 'moderate', risk_adjustment: 0 },
    { city: 'Yamoussoukro', region: 'Lacs', population_density: 'medium', economic_activity: 'medium', infrastructure_quality: 'good', risk_adjustment: 1 },
    { city: 'San-Pédro', region: 'Bas-Sassandra', population_density: 'medium', economic_activity: 'medium', infrastructure_quality: 'moderate', risk_adjustment: 0 },
    { city: 'Korhogo', region: 'Savanes', population_density: 'low', economic_activity: 'low', infrastructure_quality: 'poor', risk_adjustment: -2 },
  ],
  SN: [
    { city: 'Dakar', region: 'Dakar', population_density: 'high', economic_activity: 'high', infrastructure_quality: 'good', risk_adjustment: 3 },
    { city: 'Thiès', region: 'Thiès', population_density: 'medium', economic_activity: 'medium', infrastructure_quality: 'moderate', risk_adjustment: 1 },
    { city: 'Saint-Louis', region: 'Saint-Louis', population_density: 'medium', economic_activity: 'medium', infrastructure_quality: 'moderate', risk_adjustment: 0 },
    { city: 'Kaolack', region: 'Kaolack', population_density: 'medium', economic_activity: 'medium', infrastructure_quality: 'moderate', risk_adjustment: 0 },
    { city: 'Ziguinchor', region: 'Ziguinchor', population_density: 'low', economic_activity: 'low', infrastructure_quality: 'poor', risk_adjustment: -2 },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get economic context for a country
 */
export function getEconomicContext(countryCode: string): EconomicContext | undefined {
  return UEMOA_ECONOMIC_DATA[countryCode.toUpperCase()];
}

/**
 * Get sector risk for a country and sector
 */
export function getSectorRisk(countryCode: string, sector: string): SectorRisk | undefined {
  const countrySectors = UEMOA_SECTOR_RISKS[countryCode.toUpperCase()] || DEFAULT_SECTOR_RISKS;
  const normalizedSector = sector.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  return countrySectors.find(s => 
    normalizedSector.includes(s.sector) || s.sector.includes(normalizedSector)
  );
}

/**
 * Get city risk adjustment
 */
export function getCityRisk(countryCode: string, city: string): CityRisk | undefined {
  const countryCities = UEMOA_CITY_RISKS[countryCode.toUpperCase()];
  if (!countryCities) return undefined;
  
  const normalizedCity = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  return countryCities.find(c => 
    normalizedCity.includes(c.city.toLowerCase()) || c.city.toLowerCase().includes(normalizedCity)
  );
}

/**
 * Calculate environmental risk adjustment
 * Returns a score adjustment between -10 and +10
 */
export function calculateEnvironmentalAdjustment(
  countryCode: string,
  sector?: string,
  city?: string
): { adjustment: number; factors: { name: string; impact: number; description: string }[] } {
  const factors: { name: string; impact: number; description: string }[] = [];
  let totalAdjustment = 0;

  // Country-level adjustment
  const economicContext = getEconomicContext(countryCode);
  if (economicContext) {
    totalAdjustment += economicContext.risk_adjustment;
    factors.push({
      name: 'Contexte économique national',
      impact: economicContext.risk_adjustment,
      description: `${economicContext.country}: PIB/hab ${economicContext.gdp_per_capita}$, inclusion financière ${economicContext.financial_inclusion_rate}%`,
    });
  }

  // Sector adjustment
  if (sector) {
    const sectorRisk = getSectorRisk(countryCode, sector);
    if (sectorRisk) {
      totalAdjustment += sectorRisk.adjustment;
      factors.push({
        name: 'Risque sectoriel',
        impact: sectorRisk.adjustment,
        description: `Secteur ${sectorRisk.sector}: volatilité ${sectorRisk.volatility}%, formalisation ${sectorRisk.formalization_rate}%`,
      });
    }
  }

  // City adjustment
  if (city) {
    const cityRisk = getCityRisk(countryCode, city);
    if (cityRisk) {
      totalAdjustment += cityRisk.risk_adjustment;
      factors.push({
        name: 'Contexte urbain',
        impact: cityRisk.risk_adjustment,
        description: `${cityRisk.city}: activité économique ${cityRisk.economic_activity}, infrastructure ${cityRisk.infrastructure_quality}`,
      });
    }
  }

  // Clamp to -10/+10
  totalAdjustment = Math.max(-10, Math.min(10, totalAdjustment));

  return { adjustment: totalAdjustment, factors };
}

/**
 * Get mobile money penetration rate for credit estimation
 */
export function getMobileMoneyPenetration(countryCode: string): number {
  return UEMOA_ECONOMIC_DATA[countryCode.toUpperCase()]?.mobile_money_penetration || 30;
}

/**
 * Get average income estimate by country (FCFA/month)
 */
export function getAverageIncome(countryCode: string): number {
  const gdpPerCapita = UEMOA_ECONOMIC_DATA[countryCode.toUpperCase()]?.gdp_per_capita || 1000;
  // Convert annual USD to monthly FCFA (1 USD ≈ 600 FCFA)
  return Math.round((gdpPerCapita * 600) / 12);
}

/**
 * Validate income against national context
 * Returns a confidence factor (0-1) indicating how plausible the income is
 */
export function validateIncomeAgainstContext(
  declaredIncome: number,
  countryCode: string,
  sector?: string
): { plausible: boolean; confidence: number; message: string } {
  const avgIncome = getAverageIncome(countryCode);
  const ratio = declaredIncome / avgIncome;

  // Very low income (< 20% of average)
  if (ratio < 0.2) {
    return {
      plausible: true,
      confidence: 0.6,
      message: 'Revenu nettement inférieur à la moyenne nationale',
    };
  }

  // Low income (20-50% of average)
  if (ratio < 0.5) {
    return {
      plausible: true,
      confidence: 0.8,
      message: 'Revenu inférieur à la moyenne nationale',
    };
  }

  // Around average (50-200%)
  if (ratio <= 2) {
    return {
      plausible: true,
      confidence: 0.95,
      message: 'Revenu cohérent avec le contexte national',
    };
  }

  // High income (200-500%)
  if (ratio <= 5) {
    return {
      plausible: true,
      confidence: 0.85,
      message: 'Revenu supérieur à la moyenne - vérification recommandée',
    };
  }

  // Very high income (> 500%)
  return {
    plausible: false,
    confidence: 0.5,
    message: 'Revenu exceptionnellement élevé - vérification requise',
  };
}
