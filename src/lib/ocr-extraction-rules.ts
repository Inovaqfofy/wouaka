/**
 * Sovereign OCR Extraction Rules
 * Local document analysis without external AI dependencies
 * 
 * Uses regex patterns and heuristics to extract structured data from OCR text
 */

export interface ExtractedField {
  field: string;
  value: string | number | boolean;
  confidence: number;
  source: string; // The matched text
}

export interface DocumentExtractionResult {
  document_type: string;
  fields: ExtractedField[];
  overall_confidence: number;
  validation_warnings: string[];
  cross_validation_passed: boolean;
}

// ============================================
// UEMOA BANK NAMES
// ============================================

const UEMOA_BANKS = [
  'SGBF', 'BOA', 'BICICI', 'SIB', 'CORIS', 'ECOBANK', 'UBA', 'BNI', 'NSIA',
  'BSIC', 'ORABANK', 'BANQUE ATLANTIQUE', 'BDU', 'BMS', 'BCS', 'CBAO',
  'BNDE', 'CIB', 'DIAMOND BANK', 'GTBANK', 'SOCIETE GENERALE',
  'BRIDGE BANK', 'BDA', 'BACI', 'COFINA', 'BGFI', 'BIAO',
];

// ============================================
// UTILITY PROVIDERS
// ============================================

const UTILITY_PROVIDERS = {
  electricity: ['CIE', 'SENELEC', 'CEET', 'SONABEL', 'SBEE', 'NIGELEC', 'EDM', 'EAGB'],
  water: ['SODECI', 'SDE', 'ONEA', 'TDE', 'SONEB', 'SEEN', 'SOMAGEP', 'EAGB'],
  telecom: ['ORANGE', 'MTN', 'MOOV', 'AIRTEL', 'WAVE', 'FREE', 'EXPRESSO'],
};

// ============================================
// CNI/PASSPORT EXTRACTION RULES
// ============================================

export function extractIdentityDocument(ocrText: string): DocumentExtractionResult {
  const text = ocrText.toUpperCase();
  const fields: ExtractedField[] = [];
  const warnings: string[] = [];

  // Document type detection
  let documentType = 'unknown';
  if (/CARTE\s*NATIONALE\s*D'?IDENTIT[ÉE]/i.test(text) || /CNI/i.test(text)) {
    documentType = 'cni';
  } else if (/PASSEPORT|PASSPORT/i.test(text)) {
    documentType = 'passport';
  } else if (/PERMIS\s*DE\s*CONDUIRE|DRIVING\s*LICEN[CS]E/i.test(text)) {
    documentType = 'permis';
  } else if (/CARTE\s*DE\s*S[ÉE]JOUR|RESIDENT/i.test(text)) {
    documentType = 'carte_sejour';
  }

  // Full name extraction
  const namePatterns = [
    /(?:NOM|SURNAME|FAMILY\s*NAME)\s*[:\s]+([A-ZÀ-ÿ\s'-]+)/i,
    /(?:PR[ÉE]NOM|GIVEN\s*NAME|FIRST\s*NAME)\s*[:\s]+([A-ZÀ-ÿ\s'-]+)/i,
    /(?:NOM\s*ET\s*PR[ÉE]NOM|FULL\s*NAME)\s*[:\s]+([A-ZÀ-ÿ\s'-]+)/i,
  ];

  let lastName = '';
  let firstName = '';

  for (const pattern of namePatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      const extracted = match[1].trim();
      if (pattern.source.includes('SURNAME') || pattern.source.includes('FAMILY')) {
        lastName = extracted;
      } else if (pattern.source.includes('GIVEN') || pattern.source.includes('FIRST')) {
        firstName = extracted;
      } else {
        // Full name
        const parts = extracted.split(/\s+/);
        if (parts.length >= 2) {
          lastName = parts[0];
          firstName = parts.slice(1).join(' ');
        }
      }
    }
  }

  if (lastName || firstName) {
    const fullName = [lastName, firstName].filter(Boolean).join(' ');
    fields.push({
      field: 'full_name',
      value: fullName,
      confidence: lastName && firstName ? 85 : 60,
      source: fullName,
    });
  }

  // Date extraction (DD/MM/YYYY or YYYY-MM-DD)
  const datePatterns = [
    { pattern: /(?:N[ÉE]E?\s*LE|DATE\s*(?:DE\s*)?NAISSANCE|BIRTH\s*DATE)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i, field: 'birth_date' },
    { pattern: /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/g, field: 'date_found' },
    { pattern: /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/g, field: 'date_iso' },
  ];

  for (const { pattern, field } of datePatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      const dateStr = match[1] || match[0];
      fields.push({
        field: field === 'date_found' || field === 'date_iso' ? 'birth_date' : field,
        value: normalizeDate(dateStr),
        confidence: field === 'birth_date' ? 85 : 50,
        source: dateStr,
      });
      break;
    }
  }

  // Document number extraction
  const docNumberPatterns = [
    /N[°O]\s*[:\s]*([A-Z0-9\-\/]{6,20})/i,
    /(?:DOCUMENT|ID|CNI)\s*N[°O]?\s*[:\s]*([A-Z0-9\-\/]{6,20})/i,
    /([A-Z]{1,2}\d{6,12})/,
  ];

  for (const pattern of docNumberPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      fields.push({
        field: 'document_number',
        value: match[1].trim(),
        confidence: 75,
        source: match[0],
      });
      break;
    }
  }

  // Expiry date
  const expiryMatch = ocrText.match(/(?:EXPIR|VALID\s*(?:UNTIL|JUSQU)|FIN\s*VALIDIT)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i);
  if (expiryMatch) {
    fields.push({
      field: 'expiry_date',
      value: normalizeDate(expiryMatch[1]),
      confidence: 80,
      source: expiryMatch[0],
    });
  }

  // Country detection
  const countryPatterns = [
    { pattern: /C[ÔO]TE\s*D['']?IVOIRE|IVORY\s*COAST/i, country: 'CI' },
    { pattern: /S[ÉE]N[ÉE]GAL/i, country: 'SN' },
    { pattern: /MALI/i, country: 'ML' },
    { pattern: /BURKINA\s*FASO/i, country: 'BF' },
    { pattern: /TOGO/i, country: 'TG' },
    { pattern: /B[ÉE]NIN/i, country: 'BJ' },
    { pattern: /NIGER(?!IA)/i, country: 'NE' },
    { pattern: /GUIN[ÉE]E[\s\-]BISSAU/i, country: 'GW' },
  ];

  for (const { pattern, country } of countryPatterns) {
    if (pattern.test(text)) {
      fields.push({
        field: 'issuing_country',
        value: country,
        confidence: 90,
        source: country,
      });
      break;
    }
  }

  // Calculate overall confidence
  const overallConfidence = fields.length > 0
    ? Math.round(fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length)
    : 20;

  return {
    document_type: documentType,
    fields,
    overall_confidence: overallConfidence,
    validation_warnings: warnings,
    cross_validation_passed: fields.length >= 2,
  };
}

// ============================================
// BANK STATEMENT EXTRACTION
// ============================================

export function extractBankStatement(ocrText: string): DocumentExtractionResult {
  const text = ocrText.toUpperCase();
  const fields: ExtractedField[] = [];
  const warnings: string[] = [];

  // Bank name detection
  for (const bank of UEMOA_BANKS) {
    if (text.includes(bank)) {
      fields.push({
        field: 'bank_name',
        value: bank,
        confidence: 95,
        source: bank,
      });
      break;
    }
  }

  // Account number (masked or full)
  const accountPatterns = [
    /(?:COMPTE|ACCOUNT)\s*(?:N[°O])?\s*[:\s]*([A-Z0-9\*]{6,25})/i,
    /(\*{2,4}\d{4,8})/,
    /([A-Z]{2}\d{2}\s*[A-Z0-9\s]{10,25})/i, // IBAN-like
  ];

  for (const pattern of accountPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      fields.push({
        field: 'account_number_masked',
        value: match[1].trim(),
        confidence: 80,
        source: match[0],
      });
      break;
    }
  }

  // Amount extraction patterns
  const amountPatterns = [
    { pattern: /SOLDE\s*(?:INITIAL|D[ÉE]BUT|ANT[ÉE]RIEUR)\s*[:\s]*([\d\s,\.]+)/i, field: 'opening_balance' },
    { pattern: /SOLDE\s*(?:FINAL|FIN|NOUVEAU|ACTUEL)\s*[:\s]*([\d\s,\.]+)/i, field: 'closing_balance' },
    { pattern: /TOTAL\s*(?:CR[ÉE]DIT|ENTR[ÉE]ES?)\s*[:\s]*([\d\s,\.]+)/i, field: 'total_credits' },
    { pattern: /TOTAL\s*(?:D[ÉE]BIT|SORTIES?)\s*[:\s]*([\d\s,\.]+)/i, field: 'total_debits' },
  ];

  for (const { pattern, field } of amountPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (amount > 0) {
        fields.push({
          field,
          value: amount,
          confidence: 75,
          source: match[0],
        });
      }
    }
  }

  // Period extraction
  const periodMatch = ocrText.match(/(?:P[ÉE]RIODE|DU)\s*[\s:]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:AU|[À-])\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
  if (periodMatch) {
    fields.push({
      field: 'period_start',
      value: normalizeDate(periodMatch[1]),
      confidence: 80,
      source: periodMatch[0],
    });
    fields.push({
      field: 'period_end',
      value: normalizeDate(periodMatch[2]),
      confidence: 80,
      source: periodMatch[0],
    });
  }

  // Cross-validation: opening + credits - debits ≈ closing
  const opening = fields.find(f => f.field === 'opening_balance')?.value as number | undefined;
  const credits = fields.find(f => f.field === 'total_credits')?.value as number | undefined;
  const debits = fields.find(f => f.field === 'total_debits')?.value as number | undefined;
  const closing = fields.find(f => f.field === 'closing_balance')?.value as number | undefined;

  let crossValidationPassed = false;
  if (opening !== undefined && credits !== undefined && debits !== undefined && closing !== undefined) {
    const expected = opening + credits - debits;
    const tolerance = closing * 0.02; // 2% tolerance
    crossValidationPassed = Math.abs(expected - closing) <= tolerance;
    
    if (!crossValidationPassed) {
      warnings.push(`Incohérence des totaux: ${opening} + ${credits} - ${debits} = ${expected}, mais solde final = ${closing}`);
    }
  }

  // Salary detection
  const salaryMatch = ocrText.match(/(?:VIR(?:EMENT)?|SALAIRE|PAIE)[\s\S]{0,30}([\d\s,\.]+)/i);
  if (salaryMatch) {
    const salaryAmount = parseAmount(salaryMatch[1]);
    if (salaryAmount > 50000) { // Minimum reasonable salary in FCFA
      fields.push({
        field: 'salary_detected',
        value: true,
        confidence: 70,
        source: salaryMatch[0],
      });
      fields.push({
        field: 'salary_amount',
        value: salaryAmount,
        confidence: 65,
        source: salaryMatch[0],
      });
    }
  }

  const overallConfidence = fields.length > 0
    ? Math.round(fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length)
    : 20;

  return {
    document_type: 'releve_bancaire',
    fields,
    overall_confidence: overallConfidence,
    validation_warnings: warnings,
    cross_validation_passed: crossValidationPassed || fields.length < 4,
  };
}

// ============================================
// UTILITY BILL EXTRACTION
// ============================================

export function extractUtilityBill(ocrText: string): DocumentExtractionResult {
  const text = ocrText.toUpperCase();
  const fields: ExtractedField[] = [];
  const warnings: string[] = [];

  // Provider detection
  let providerType: 'electricity' | 'water' | 'telecom' | undefined;
  let providerName: string | undefined;

  for (const [type, providers] of Object.entries(UTILITY_PROVIDERS)) {
    for (const provider of providers) {
      if (text.includes(provider)) {
        providerType = type as 'electricity' | 'water' | 'telecom';
        providerName = provider;
        break;
      }
    }
    if (providerName) break;
  }

  if (providerName) {
    fields.push({
      field: 'provider',
      value: providerName,
      confidence: 95,
      source: providerName,
    });
    fields.push({
      field: 'utility_type',
      value: providerType!,
      confidence: 90,
      source: providerName,
    });
  }

  // Customer name
  const nameMatch = ocrText.match(/(?:ABONN[ÉE]|NOM|CLIENT|TITULAIRE)\s*[:\s]+([A-ZÀ-ÿ\s'-]+)/i);
  if (nameMatch) {
    fields.push({
      field: 'customer_name',
      value: nameMatch[1].trim(),
      confidence: 75,
      source: nameMatch[0],
    });
  }

  // Customer ID
  const customerIdMatch = ocrText.match(/(?:N[°O]\s*(?:ABONN[ÉE]|COMPTEUR|CLIENT)|REF)\s*[:\s]*([A-Z0-9\-]{5,20})/i);
  if (customerIdMatch) {
    fields.push({
      field: 'customer_id',
      value: customerIdMatch[1].trim(),
      confidence: 80,
      source: customerIdMatch[0],
    });
  }

  // Amount due
  const amountMatch = ocrText.match(/(?:MONTANT|TOTAL)\s*(?:[ÀA]\s*PAYER|TTC|D[ÛU])\s*[:\s]*([\d\s,\.]+)/i);
  if (amountMatch) {
    fields.push({
      field: 'amount_due',
      value: parseAmount(amountMatch[1]),
      confidence: 85,
      source: amountMatch[0],
    });
  }

  // Consumption (kWh or m³)
  const consumptionMatch = ocrText.match(/(?:CONSOMMATION|CONSO)\s*[:\s]*([\d\s,\.]+)\s*(?:KWH|M[³3]|LITRES?)?/i);
  if (consumptionMatch) {
    fields.push({
      field: 'consumption',
      value: parseAmount(consumptionMatch[1]),
      confidence: 75,
      source: consumptionMatch[0],
    });
  }

  // Due date
  const dueDateMatch = ocrText.match(/(?:DATE\s*LIMITE|[ÀA]\s*PAYER\s*AVANT|[ÉE]CH[ÉE]ANCE)\s*[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i);
  if (dueDateMatch) {
    fields.push({
      field: 'due_date',
      value: normalizeDate(dueDateMatch[1]),
      confidence: 80,
      source: dueDateMatch[0],
    });
  }

  // Address extraction
  const addressPatterns = [
    /(?:ADRESSE|LIEU|LOCALISATION)\s*[:\s]+([A-ZÀ-ÿ0-9\s,\-\.]+)/i,
    /((?:BP|BOITE\s*POSTALE)\s*\d+)/i,
  ];

  for (const pattern of addressPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      fields.push({
        field: 'address',
        value: match[1].trim(),
        confidence: 65,
        source: match[0],
      });
      break;
    }
  }

  // Payment status
  const paidMatch = /PAY[ÉE]|R[ÉE]GL[ÉE]|ACQUITT[ÉE]/i.test(text);
  if (paidMatch) {
    fields.push({
      field: 'payment_status',
      value: 'paid',
      confidence: 85,
      source: 'PAYÉ',
    });
  }

  const overallConfidence = fields.length > 0
    ? Math.round(fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length)
    : 20;

  return {
    document_type: 'justificatif_domicile',
    fields,
    overall_confidence: overallConfidence,
    validation_warnings: warnings,
    cross_validation_passed: Boolean(providerName && (customerIdMatch || nameMatch)),
  };
}

// ============================================
// MOBILE MONEY EXTRACTION
// ============================================

export function extractMobileMoneyData(ocrText: string): DocumentExtractionResult {
  const text = ocrText.toUpperCase();
  const fields: ExtractedField[] = [];
  const warnings: string[] = [];

  // Provider detection
  const momoProviders = [
    { pattern: /ORANGE\s*MONEY/i, name: 'Orange Money' },
    { pattern: /MTN\s*MO(?:MO|BILE\s*MONEY)/i, name: 'MTN MoMo' },
    { pattern: /MOOV\s*MONEY/i, name: 'Moov Money' },
    { pattern: /WAVE/i, name: 'Wave' },
    { pattern: /AIRTEL\s*MONEY/i, name: 'Airtel Money' },
  ];

  for (const { pattern, name } of momoProviders) {
    if (pattern.test(text)) {
      fields.push({
        field: 'provider',
        value: name,
        confidence: 95,
        source: name,
      });
      break;
    }
  }

  // Balance extraction
  const balanceMatch = ocrText.match(/(?:SOLDE|BALANCE)\s*[:\s]*([\d\s,\.]+)\s*(?:FCFA|XOF|F)?/i);
  if (balanceMatch) {
    fields.push({
      field: 'current_balance',
      value: parseAmount(balanceMatch[1]),
      confidence: 80,
      source: balanceMatch[0],
    });
  }

  // Phone number (masked)
  const phoneMatch = ocrText.match(/(\d{2})\s*\*{2,4}\s*(\d{2,4})/);
  if (phoneMatch) {
    fields.push({
      field: 'phone_number_masked',
      value: `${phoneMatch[1]}****${phoneMatch[2]}`,
      confidence: 75,
      source: phoneMatch[0],
    });
  }

  // Transaction ID
  const txIdMatch = ocrText.match(/(?:ID|REF|N[°O])\s*[:\s]*([A-Z0-9]{8,20})/i);
  if (txIdMatch) {
    fields.push({
      field: 'transaction_id',
      value: txIdMatch[1],
      confidence: 85,
      source: txIdMatch[0],
    });
  }

  // Transaction amounts
  const amountMatches = [...ocrText.matchAll(/([\d\s,\.]+)\s*(?:FCFA|XOF|F\s)/gi)];
  if (amountMatches.length > 0) {
    const amounts = amountMatches.map(m => parseAmount(m[1])).filter(a => a > 0);
    if (amounts.length > 0) {
      fields.push({
        field: 'transaction_amounts',
        value: amounts.join(', '),
        confidence: 70,
        source: 'Multiple amounts detected',
      });
    }
  }

  const overallConfidence = fields.length > 0
    ? Math.round(fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length)
    : 20;

  return {
    document_type: 'mobile_money',
    fields,
    overall_confidence: overallConfidence,
    validation_warnings: warnings,
    cross_validation_passed: fields.length >= 2,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeDate(dateStr: string): string {
  // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // Already YYYY-MM-DD
      return dateStr;
    }
    // Assume DD/MM/YYYY
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function parseAmount(amountStr: string): number {
  // Remove spaces, replace comma with dot, parse as float
  const cleaned = amountStr.replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

export function extractDocumentData(
  ocrText: string,
  documentType?: string
): DocumentExtractionResult {
  // Auto-detect document type if not provided
  const text = ocrText.toUpperCase();
  
  if (documentType === 'releve_bancaire' || UEMOA_BANKS.some(b => text.includes(b))) {
    return extractBankStatement(ocrText);
  }
  
  if (documentType === 'justificatif_domicile' || 
      Object.values(UTILITY_PROVIDERS).flat().some(p => text.includes(p))) {
    return extractUtilityBill(ocrText);
  }
  
  if (documentType === 'mobile_money' || /ORANGE\s*MONEY|MTN|WAVE|MOOV/i.test(text)) {
    return extractMobileMoneyData(ocrText);
  }
  
  // Default to identity document
  return extractIdentityDocument(ocrText);
}
