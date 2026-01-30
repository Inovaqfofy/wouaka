// ============================================
// DOCUMENT ANALYZE - Sovereign OCR Extraction
// NO external AI dependencies - uses local regex/pattern rules
// Includes MRZ parsing for CEDEAO/UEMOA documents (ICAO 9303)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentAnalysisRequest {
  ocr_text: string;
  document_type?: 'cni' | 'passport' | 'permis' | 'justificatif_domicile' | 'releve_bancaire' | 'mobile_money' | 'unknown';
  ocr_confidence?: number;
  document_id?: string; // Optional: if provided, we update kyc_documents directly
}

interface ExtractedField {
  field: string;
  value: string | number | boolean;
  confidence: number;
  source: string;
}

interface DocumentExtractionResult {
  document_type: string;
  fields: ExtractedField[];
  overall_confidence: number;
  validation_warnings: string[];
  cross_validation_passed: boolean;
  mrz_validated?: boolean;
  mrz_data?: MRZData | null;
}

// ============================================
// MRZ PARSING (ICAO 9303 Standard)
// ============================================

interface MRZData {
  documentType: 'passport' | 'id_card' | 'visa' | 'unknown';
  documentCode: string;
  issuingCountry: string;
  issuingCountryName: string;
  lastName: string;
  firstName: string;
  documentNumber: string;
  nationality: string;
  nationalityName: string;
  dateOfBirth: string;
  dateOfBirthFormatted: string;
  sex: 'M' | 'F' | 'X';
  expirationDate: string;
  expirationDateFormatted: string;
  personalNumber?: string;
  isValid: boolean;
  validationDetails: {
    documentNumberValid: boolean;
    dateOfBirthValid: boolean;
    expirationDateValid: boolean;
    compositeValid: boolean;
    isUEMOA: boolean;
    isCEDEAO: boolean;
  };
  rawMRZ: string[];
  confidence: number;
}

const MRZ_WEIGHTS = [7, 3, 1];

const UEMOA_COUNTRY_CODES = ['SEN', 'CIV', 'MLI', 'BFA', 'NER', 'TGO', 'BEN', 'GNB'];
const CEDEAO_COUNTRY_CODES = [...UEMOA_COUNTRY_CODES, 'GHA', 'NGA', 'GIN', 'LBR', 'SLE', 'GMB', 'CPV'];

const COUNTRY_NAMES: Record<string, string> = {
  'SEN': 'Sénégal', 'CIV': 'Côte d\'Ivoire', 'MLI': 'Mali', 'BFA': 'Burkina Faso',
  'NER': 'Niger', 'TGO': 'Togo', 'BEN': 'Bénin', 'GNB': 'Guinée-Bissau',
  'GHA': 'Ghana', 'NGA': 'Nigeria', 'GIN': 'Guinée', 'LBR': 'Liberia',
  'SLE': 'Sierra Leone', 'GMB': 'Gambie', 'CPV': 'Cap-Vert',
  'FRA': 'France', 'USA': 'États-Unis', 'GBR': 'Royaume-Uni', 'DEU': 'Allemagne',
};

function calculateMRZCheckDigit(input: string): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    let value: number;
    if (char === '<') value = 0;
    else if (char >= '0' && char <= '9') value = parseInt(char, 10);
    else if (char >= 'A' && char <= 'Z') value = char.charCodeAt(0) - 55;
    else value = 0;
    sum += value * MRZ_WEIGHTS[i % 3];
  }
  return sum % 10;
}

function validateMRZCheckDigit(data: string, expectedDigit: string): boolean {
  if (expectedDigit === '<') return true;
  return calculateMRZCheckDigit(data) === parseInt(expectedDigit, 10);
}

function formatMRZDate(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6) return '';
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  const century = yy > 30 ? '19' : '20';
  return `${dd}/${mm}/${century}${yymmdd.substring(0, 2)}`;
}

function cleanMRZLine(line: string): string {
  return line.replace(/\s/g, '').toUpperCase();
}

function extractMRZName(nameField: string): { lastName: string; firstName: string } {
  const parts = nameField.split('<<');
  return {
    lastName: (parts[0] || '').replace(/</g, ' ').trim(),
    firstName: (parts[1] || '').replace(/</g, ' ').trim(),
  };
}

function parseTD1(lines: string[]): MRZData | null {
  if (lines.length < 3) return null;
  const line1 = cleanMRZLine(lines[0]);
  const line2 = cleanMRZLine(lines[1]);
  const line3 = cleanMRZLine(lines[2]);
  if (line1.length < 30 || line2.length < 30 || line3.length < 30) return null;

  const documentCode = line1.substring(0, 2);
  const issuingCountry = line1.substring(2, 5);
  const documentNumber = line1.substring(5, 14).replace(/</g, '');
  const documentNumberCheck = line1[14];
  const optionalData1 = line1.substring(15, 30);

  const dateOfBirth = line2.substring(0, 6);
  const dobCheck = line2[6];
  const sex = line2[7] as 'M' | 'F' | 'X';
  const expirationDate = line2.substring(8, 14);
  const expirationCheck = line2[14];
  const nationality = line2.substring(15, 18);
  const optionalData2 = line2.substring(18, 29);
  const compositeCheck = line2[29];

  const { lastName, firstName } = extractMRZName(line3);

  const documentNumberValid = validateMRZCheckDigit(line1.substring(5, 14), documentNumberCheck);
  const dateOfBirthValid = validateMRZCheckDigit(dateOfBirth, dobCheck);
  const expirationDateValid = validateMRZCheckDigit(expirationDate, expirationCheck);
  const compositeData = line1.substring(5, 30) + line2.substring(0, 7) + line2.substring(8, 15) + line2.substring(18, 29);
  const compositeValid = validateMRZCheckDigit(compositeData, compositeCheck);

  const isUEMOA = UEMOA_COUNTRY_CODES.includes(issuingCountry);
  const isCEDEAO = CEDEAO_COUNTRY_CODES.includes(issuingCountry);
  const isValid = documentNumberValid && dateOfBirthValid && expirationDateValid && compositeValid;

  return {
    documentType: documentCode.startsWith('I') ? 'id_card' : 'unknown',
    documentCode, issuingCountry, issuingCountryName: COUNTRY_NAMES[issuingCountry] || issuingCountry,
    lastName, firstName, documentNumber, nationality, nationalityName: COUNTRY_NAMES[nationality] || nationality,
    dateOfBirth, dateOfBirthFormatted: formatMRZDate(dateOfBirth),
    sex, expirationDate, expirationDateFormatted: formatMRZDate(expirationDate),
    personalNumber: optionalData1.replace(/</g, '').trim() || optionalData2.replace(/</g, '').trim() || undefined,
    isValid,
    validationDetails: { documentNumberValid, dateOfBirthValid, expirationDateValid, compositeValid, isUEMOA, isCEDEAO },
    rawMRZ: [line1, line2, line3],
    confidence: isValid ? 100 : (documentNumberValid && dateOfBirthValid ? 80 : 50),
  };
}

function parseTD3(lines: string[]): MRZData | null {
  if (lines.length < 2) return null;
  const line1 = cleanMRZLine(lines[0]);
  const line2 = cleanMRZLine(lines[1]);
  if (line1.length < 44 || line2.length < 44) return null;

  const documentCode = line1.substring(0, 2);
  const issuingCountry = line1.substring(2, 5);
  const { lastName, firstName } = extractMRZName(line1.substring(5, 44));

  const documentNumber = line2.substring(0, 9).replace(/</g, '');
  const documentNumberCheck = line2[9];
  const nationality = line2.substring(10, 13);
  const dateOfBirth = line2.substring(13, 19);
  const dobCheck = line2[19];
  const sex = line2[20] as 'M' | 'F' | 'X';
  const expirationDate = line2.substring(21, 27);
  const expirationCheck = line2[27];
  const personalNumber = line2.substring(28, 42).replace(/</g, '').trim();
  const compositeCheck = line2[43];

  const documentNumberValid = validateMRZCheckDigit(line2.substring(0, 9), documentNumberCheck);
  const dateOfBirthValid = validateMRZCheckDigit(dateOfBirth, dobCheck);
  const expirationDateValid = validateMRZCheckDigit(expirationDate, expirationCheck);
  const compositeData = line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43);
  const compositeValid = validateMRZCheckDigit(compositeData, compositeCheck);

  const isUEMOA = UEMOA_COUNTRY_CODES.includes(issuingCountry);
  const isCEDEAO = CEDEAO_COUNTRY_CODES.includes(issuingCountry);
  const isValid = documentNumberValid && dateOfBirthValid && expirationDateValid && compositeValid;

  return {
    documentType: 'passport', documentCode, issuingCountry, issuingCountryName: COUNTRY_NAMES[issuingCountry] || issuingCountry,
    lastName, firstName, documentNumber, nationality, nationalityName: COUNTRY_NAMES[nationality] || nationality,
    dateOfBirth, dateOfBirthFormatted: formatMRZDate(dateOfBirth),
    sex, expirationDate, expirationDateFormatted: formatMRZDate(expirationDate),
    personalNumber: personalNumber || undefined, isValid,
    validationDetails: { documentNumberValid, dateOfBirthValid, expirationDateValid, compositeValid, isUEMOA, isCEDEAO },
    rawMRZ: [line1, line2],
    confidence: isValid ? 100 : (documentNumberValid && dateOfBirthValid ? 80 : 50),
  };
}

function detectMRZLines(ocrText: string): string[] {
  const lines = ocrText.split('\n').map(line => line.trim());
  const mrzPattern = /^[A-Z0-9<]{28,46}$/;
  return lines.map(cleanMRZLine).filter(line => mrzPattern.test(line) && line.length >= 28);
}

function parseMRZ(ocrText: string): { found: boolean; mrz: MRZData | null; rawLines: string[]; error?: string } {
  try {
    const mrzLines = detectMRZLines(ocrText);
    if (mrzLines.length === 0) return { found: false, mrz: null, rawLines: [], error: 'Aucune zone MRZ détectée' };

    const td3Lines = mrzLines.filter(line => line.length >= 44);
    if (td3Lines.length >= 2) {
      const mrz = parseTD3(td3Lines.slice(0, 2));
      if (mrz) return { found: true, mrz, rawLines: td3Lines.slice(0, 2) };
    }

    const td1Lines = mrzLines.filter(line => line.length >= 30 && line.length < 44);
    if (td1Lines.length >= 3) {
      const mrz = parseTD1(td1Lines.slice(0, 3));
      if (mrz) return { found: true, mrz, rawLines: td1Lines.slice(0, 3) };
    }

    return { found: false, mrz: null, rawLines: mrzLines, error: 'Format MRZ non reconnu' };
  } catch (error) {
    return { found: false, mrz: null, rawLines: [], error: `Erreur MRZ: ${error}` };
  }
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
// HELPER FUNCTIONS
// ============================================

function normalizeDate(dateStr: string): string {
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return dateStr;
    }
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

// ============================================
// IDENTITY DOCUMENT EXTRACTION
// ============================================

function extractIdentityDocument(ocrText: string): DocumentExtractionResult {
  const text = ocrText.toUpperCase();
  const fields: ExtractedField[] = [];
  const warnings: string[] = [];

  // Try MRZ parsing first (highest confidence)
  const mrzResult = parseMRZ(ocrText);
  let mrzValidated = false;
  let mrzData: MRZData | null = null;

  if (mrzResult.found && mrzResult.mrz) {
    mrzData = mrzResult.mrz;
    mrzValidated = mrzData.isValid;

    // Add MRZ-extracted fields with high confidence
    if (mrzData.lastName || mrzData.firstName) {
      fields.push({
        field: 'full_name',
        value: [mrzData.lastName, mrzData.firstName].filter(Boolean).join(' '),
        confidence: mrzData.isValid ? 98 : 85,
        source: 'MRZ',
      });
    }

    if (mrzData.documentNumber) {
      fields.push({
        field: 'document_number',
        value: mrzData.documentNumber,
        confidence: mrzData.validationDetails.documentNumberValid ? 100 : 75,
        source: 'MRZ',
      });
    }

    if (mrzData.dateOfBirthFormatted) {
      fields.push({
        field: 'birth_date',
        value: mrzData.dateOfBirthFormatted,
        confidence: mrzData.validationDetails.dateOfBirthValid ? 100 : 80,
        source: 'MRZ',
      });
    }

    if (mrzData.expirationDateFormatted) {
      fields.push({
        field: 'expiry_date',
        value: mrzData.expirationDateFormatted,
        confidence: mrzData.validationDetails.expirationDateValid ? 100 : 80,
        source: 'MRZ',
      });
    }

    if (mrzData.issuingCountry) {
      fields.push({
        field: 'issuing_country',
        value: mrzData.issuingCountry,
        confidence: 95,
        source: 'MRZ',
      });
    }

    if (mrzData.nationality) {
      fields.push({
        field: 'nationality',
        value: mrzData.nationality,
        confidence: 95,
        source: 'MRZ',
      });
    }

    if (mrzData.sex && mrzData.sex !== 'X') {
      fields.push({
        field: 'gender',
        value: mrzData.sex,
        confidence: 95,
        source: 'MRZ',
      });
    }

    // Add UEMOA/CEDEAO badges
    if (mrzData.validationDetails.isUEMOA) {
      fields.push({ field: 'is_uemoa', value: true, confidence: 100, source: 'MRZ' });
    }
    if (mrzData.validationDetails.isCEDEAO) {
      fields.push({ field: 'is_cedeao', value: true, confidence: 100, source: 'MRZ' });
    }
  }

  // Document type detection (fallback if not from MRZ)
  let documentType = mrzData?.documentType === 'passport' ? 'passport' : 
                     mrzData?.documentType === 'id_card' ? 'cni' : 'unknown';
  
  if (documentType === 'unknown') {
    if (/CARTE\s*NATIONALE\s*D'?IDENTIT[ÉE]/i.test(text) || /\bCNI\b/i.test(text)) {
      documentType = 'cni';
    } else if (/PASSEPORT|PASSPORT/i.test(text)) {
      documentType = 'passport';
    } else if (/PERMIS\s*DE\s*CONDUIRE|DRIVING\s*LICEN[CS]E/i.test(text)) {
      documentType = 'permis';
    } else if (/CARTE\s*DE\s*S[ÉE]JOUR|RESIDENT/i.test(text)) {
      documentType = 'carte_sejour';
    }
  }

  // Fallback: regex extraction if MRZ not found or incomplete
  if (!mrzValidated || fields.length < 3) {
    // Full name extraction
    if (!fields.find(f => f.field === 'full_name')) {
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
          } else if (pattern.source.includes('GIVEN') || pattern.source.includes('FIRST') || pattern.source.includes('PRÉNOM') || pattern.source.includes('PRENOM')) {
            firstName = extracted;
          } else {
            const parts = extracted.split(/\s+/);
            if (parts.length >= 2) {
              lastName = parts[0];
              firstName = parts.slice(1).join(' ');
            }
          }
        }
      }

      if (lastName || firstName) {
        fields.push({
          field: 'full_name',
          value: [lastName, firstName].filter(Boolean).join(' '),
          confidence: lastName && firstName ? 70 : 50,
          source: 'OCR regex',
        });
      }
    }

    // Date extraction
    if (!fields.find(f => f.field === 'birth_date')) {
      const datePatterns = [
        { pattern: /(?:N[ÉE]E?\s*LE|DATE\s*(?:DE\s*)?NAISSANCE|BIRTH\s*DATE)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i, conf: 75 },
        { pattern: /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/g, conf: 40 },
      ];

      for (const { pattern, conf } of datePatterns) {
        const match = ocrText.match(pattern);
        if (match) {
          const dateStr = match[1] || match[0];
          fields.push({
            field: 'birth_date',
            value: normalizeDate(dateStr),
            confidence: conf,
            source: 'OCR regex',
          });
          break;
        }
      }
    }

    // Document number extraction
    if (!fields.find(f => f.field === 'document_number')) {
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
            confidence: 60,
            source: 'OCR regex',
          });
          break;
        }
      }
    }

    // Expiry date
    if (!fields.find(f => f.field === 'expiry_date')) {
      const expiryMatch = ocrText.match(/(?:EXPIR|VALID\s*(?:UNTIL|JUSQU)|FIN\s*VALIDIT)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i);
      if (expiryMatch) {
        fields.push({
          field: 'expiry_date',
          value: normalizeDate(expiryMatch[1]),
          confidence: 70,
          source: 'OCR regex',
        });
      }
    }

    // Country detection
    if (!fields.find(f => f.field === 'issuing_country')) {
      const countryPatterns = [
        { pattern: /C[ÔO]TE\s*D['']?IVOIRE|IVORY\s*COAST/i, country: 'CIV' },
        { pattern: /S[ÉE]N[ÉE]GAL/i, country: 'SEN' },
        { pattern: /MALI/i, country: 'MLI' },
        { pattern: /BURKINA\s*FASO/i, country: 'BFA' },
        { pattern: /TOGO/i, country: 'TGO' },
        { pattern: /B[ÉE]NIN/i, country: 'BEN' },
        { pattern: /NIGER(?!IA)/i, country: 'NER' },
        { pattern: /GUIN[ÉE]E[\s\-]BISSAU/i, country: 'GNB' },
      ];

      for (const { pattern, country } of countryPatterns) {
        if (pattern.test(text)) {
          fields.push({
            field: 'issuing_country',
            value: country,
            confidence: 80,
            source: 'OCR regex',
          });
          break;
        }
      }
    }
  }

  // Add validation warnings
  if (mrzResult.error && !mrzValidated) {
    warnings.push(`MRZ: ${mrzResult.error}`);
  }
  if (mrzData && !mrzData.isValid) {
    warnings.push('MRZ détectée mais validation des checksums échouée');
  }

  const overallConfidence = fields.length > 0
    ? Math.round(fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length)
    : 20;

  return {
    document_type: documentType,
    fields,
    overall_confidence: mrzValidated ? Math.max(overallConfidence, 90) : overallConfidence,
    validation_warnings: warnings,
    cross_validation_passed: mrzValidated || fields.length >= 2,
    mrz_validated: mrzValidated,
    mrz_data: mrzData,
  };
}

// ============================================
// BANK STATEMENT EXTRACTION
// ============================================

function extractBankStatement(ocrText: string): DocumentExtractionResult {
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

  // Account number
  const accountPatterns = [
    /(?:COMPTE|ACCOUNT)\s*(?:N[°O])?\s*[:\s]*([A-Z0-9\*]{6,25})/i,
    /(\*{2,4}\d{4,8})/,
    /([A-Z]{2}\d{2}\s*[A-Z0-9\s]{10,25})/i,
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

  // Amount extraction
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

  // Cross-validation
  const opening = fields.find(f => f.field === 'opening_balance')?.value as number | undefined;
  const credits = fields.find(f => f.field === 'total_credits')?.value as number | undefined;
  const debits = fields.find(f => f.field === 'total_debits')?.value as number | undefined;
  const closing = fields.find(f => f.field === 'closing_balance')?.value as number | undefined;

  let crossValidationPassed = false;
  if (opening !== undefined && credits !== undefined && debits !== undefined && closing !== undefined) {
    const expected = opening + credits - debits;
    const tolerance = Math.max(closing * 0.02, 100);
    crossValidationPassed = Math.abs(expected - closing) <= tolerance;
    
    if (!crossValidationPassed) {
      warnings.push(`Incohérence des totaux: ${opening} + ${credits} - ${debits} = ${expected}, mais solde final = ${closing}`);
    }
  }

  // Salary detection
  const salaryMatch = ocrText.match(/(?:VIR(?:EMENT)?|SALAIRE|PAIE)[\s\S]{0,30}([\d\s,\.]+)/i);
  if (salaryMatch) {
    const salaryAmount = parseAmount(salaryMatch[1]);
    if (salaryAmount > 50000) {
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

function extractUtilityBill(ocrText: string): DocumentExtractionResult {
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

  // Consumption
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

  // Address
  const addressMatch = ocrText.match(/(?:ADRESSE|LIEU|LOCALISATION)\s*[:\s]+([A-ZÀ-ÿ0-9\s,\-\.]+)/i);
  if (addressMatch) {
    fields.push({
      field: 'address',
      value: addressMatch[1].trim(),
      confidence: 65,
      source: addressMatch[0],
    });
  }

  // Payment status
  if (/PAY[ÉE]|R[ÉE]GL[ÉE]|ACQUITT[ÉE]/i.test(text)) {
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

function extractMobileMoneyData(ocrText: string): DocumentExtractionResult {
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

  // Balance
  const balanceMatch = ocrText.match(/(?:SOLDE|BALANCE)\s*[:\s]*([\d\s,\.]+)\s*(?:FCFA|XOF|F)?/i);
  if (balanceMatch) {
    fields.push({
      field: 'current_balance',
      value: parseAmount(balanceMatch[1]),
      confidence: 80,
      source: balanceMatch[0],
    });
  }

  // Phone number
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
// MAIN EXTRACTION FUNCTION
// ============================================

function extractDocumentData(
  ocrText: string,
  documentType?: string
): DocumentExtractionResult {
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
  
  return extractIdentityDocument(ocrText);
}

// ============================================
// CONVERT TO LEGACY FORMAT
// ============================================

function convertToLegacyFormat(result: DocumentExtractionResult): Record<string, unknown> {
  const output: Record<string, unknown> = {
    document_type: result.document_type,
    extraction_confidence: result.overall_confidence,
    raw_fields: {},
  };

  for (const field of result.fields) {
    output[field.field] = field.value;
    (output.raw_fields as Record<string, string>)[field.field] = String(field.value);
  }

  // Add warnings and validation info
  output.validation_warnings = result.validation_warnings;
  output.cross_validation_passed = result.cross_validation_passed;

  return output;
}

// ============================================
// HTTP HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ocr_text, document_type, ocr_confidence, document_id }: DocumentAnalysisRequest = await req.json();

    console.log('[DocumentAnalyze] Received request:', {
      textLength: ocr_text?.length || 0,
      document_type,
      ocr_confidence,
      document_id,
      hasAuthHeader: !!req.headers.get('Authorization')
    });

    if (!ocr_text || ocr_text.trim().length < 3) {
      console.warn('[DocumentAnalyze] Rejected: text too short');
      return new Response(
        JSON.stringify({ error: 'ocr_text is required and must have at least 3 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    // Use sovereign local extraction - NO external AI
    const result = extractDocumentData(ocr_text, document_type);
    
    console.log('[DocumentAnalyze] Extraction result:', {
      document_type: result.document_type,
      fields_count: result.fields.length,
      overall_confidence: result.overall_confidence,
      mrz_validated: result.mrz_validated
    });
    
    // Adjust confidence based on OCR quality
    if (ocr_confidence) {
      result.overall_confidence = Math.round(
        result.overall_confidence * (ocr_confidence / 100)
      );
    }

    const processingTime = Date.now() - startTime;
    const legacyOutput = convertToLegacyFormat(result);

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If document_id provided, verify auth and update kyc_documents
    let statusApplied = 'pending';
    let userId: string | null = null;

    if (document_id) {
      console.log('[DocumentAnalyze] Processing document_id:', document_id);
      
      // Validate user auth from Authorization header
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
        
        if (claimsError) {
          console.warn('[DocumentAnalyze] Auth error:', claimsError.message);
        }
        
        if (!claimsError && claimsData?.user) {
          userId = claimsData.user.id;
          console.log('[DocumentAnalyze] Authenticated user:', userId);
          
          // Verify document belongs to user
          const { data: docRecord, error: docError } = await supabase
            .from('kyc_documents')
            .select('id, user_id')
            .eq('id', document_id)
            .single();
          
          if (docError) {
            console.warn('[DocumentAnalyze] Doc fetch error:', docError.message);
          }
          
          if (!docError && docRecord && docRecord.user_id === userId) {
            // LOWERED threshold from 70 to 50 for verification
            // Also verify if we have meaningful fields extracted
            const hasFields = result.fields.length >= 1;
            statusApplied = (result.overall_confidence >= 50 && hasFields) ? 'verified' : 'pending';
            
            console.log('[DocumentAnalyze] Updating kyc_documents:', {
              document_id,
              statusApplied,
              confidence: result.overall_confidence,
              fieldsCount: result.fields.length
            });
            
            // Update kyc_documents with service role (bypasses RLS)
            const { error: updateError } = await supabase
              .from('kyc_documents')
              .update({
                status: statusApplied,
                ocr_data: legacyOutput,
                ocr_confidence: result.overall_confidence,
              })
              .eq('id', document_id);
            
            if (updateError) {
              console.error('[DocumentAnalyze] Failed to update kyc_documents:', updateError);
              statusApplied = 'update_failed';
            } else {
              console.log(`[DocumentAnalyze] Successfully updated document ${document_id} to status: ${statusApplied}`);
            }
          } else {
            console.warn('[DocumentAnalyze] Document not found or user mismatch:', {
              docFound: !!docRecord,
              docUserId: docRecord?.user_id,
              authUserId: userId
            });
          }
        } else {
          console.warn('[DocumentAnalyze] No valid user from token');
        }
      } else {
        console.warn('[DocumentAnalyze] No Authorization header provided');
      }
    }

    // Store in data_enrichments (log the analysis)
    try {
      await supabase.from('data_enrichments').insert({
        source_type: 'identity', // Use existing allowed value instead of 'document_ocr'
        source_provider: 'sovereign_extraction',
        raw_data: { ocr_text: ocr_text.substring(0, 500), document_type, ocr_confidence, document_id },
        normalized_data: result,
        confidence_score: result.overall_confidence,
        verification_status: result.overall_confidence >= 70 ? 'verified' : 'pending',
        processing_time_ms: processingTime,
        is_simulated: false,
      });
    } catch (enrichErr) {
      console.warn('[DocumentAnalyze] data_enrichments insert failed:', enrichErr);
      // Non-blocking - continue even if logging fails
    }

    console.log(`[DocumentAnalyze] Extracted ${result.fields.length} fields from ${result.document_type} (confidence: ${result.overall_confidence}%)`);

    return new Response(
      JSON.stringify({
        ...legacyOutput,
        processing_time_ms: processingTime,
        method: 'sovereign_extraction',
        fields_extracted: result.fields.length,
        overall_confidence: result.overall_confidence,
        status_applied: statusApplied,
        document_id: document_id || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document analyze error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
