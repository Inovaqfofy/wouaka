/**
 * MRZ Parser for UEMOA/CEDEAO Identity Documents
 * Parses Machine Readable Zone (MRZ) from CNI and Passports
 * Validates checksums according to ICAO 9303 standard
 */

// MRZ check digit calculation (ICAO 9303)
const MRZ_WEIGHTS = [7, 3, 1];

function calculateCheckDigit(input: string): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    let value: number;
    
    if (char === '<') {
      value = 0;
    } else if (char >= '0' && char <= '9') {
      value = parseInt(char, 10);
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 55; // A=10, B=11, etc.
    } else {
      value = 0;
    }
    
    sum += value * MRZ_WEIGHTS[i % 3];
  }
  
  return sum % 10;
}

function validateCheckDigit(data: string, expectedDigit: string): boolean {
  if (expectedDigit === '<') return true; // Filler character
  const calculated = calculateCheckDigit(data);
  return calculated === parseInt(expectedDigit, 10);
}

// UEMOA/CEDEAO country codes
const UEMOA_COUNTRY_CODES = ['SEN', 'CIV', 'MLI', 'BFA', 'NER', 'TGO', 'BEN', 'GNB'];
const CEDEAO_COUNTRY_CODES = [...UEMOA_COUNTRY_CODES, 'GHA', 'NGA', 'GIN', 'LBR', 'SLE', 'GMB', 'CPV'];

export interface MRZData {
  documentType: 'passport' | 'id_card' | 'visa' | 'unknown';
  documentCode: string;
  issuingCountry: string;
  issuingCountryName: string;
  lastName: string;
  firstName: string;
  documentNumber: string;
  nationality: string;
  nationalityName: string;
  dateOfBirth: string; // YYMMDD
  dateOfBirthFormatted: string; // DD/MM/YYYY
  sex: 'M' | 'F' | 'X';
  expirationDate: string; // YYMMDD
  expirationDateFormatted: string; // DD/MM/YYYY
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

export interface MRZDetectionResult {
  found: boolean;
  mrz: MRZData | null;
  rawLines: string[];
  error?: string;
}

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'SEN': 'Sénégal',
  'CIV': 'Côte d\'Ivoire',
  'MLI': 'Mali',
  'BFA': 'Burkina Faso',
  'NER': 'Niger',
  'TGO': 'Togo',
  'BEN': 'Bénin',
  'GNB': 'Guinée-Bissau',
  'GHA': 'Ghana',
  'NGA': 'Nigeria',
  'GIN': 'Guinée',
  'LBR': 'Liberia',
  'SLE': 'Sierra Leone',
  'GMB': 'Gambie',
  'CPV': 'Cap-Vert',
  'FRA': 'France',
  'USA': 'États-Unis',
  'GBR': 'Royaume-Uni',
  'DEU': 'Allemagne',
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

function formatDate(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6) return '';
  
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  
  // Determine century: if yy > 30, assume 1900s, else 2000s
  const century = yy > 30 ? '19' : '20';
  
  return `${dd}/${mm}/${century}${yymmdd.substring(0, 2)}`;
}

function cleanMRZLine(line: string): string {
  // Remove spaces and convert to uppercase
  return line.replace(/\s/g, '').toUpperCase();
}

function extractName(nameField: string): { lastName: string; firstName: string } {
  // Names are separated by <<, components by <
  const parts = nameField.split('<<');
  const lastName = (parts[0] || '').replace(/</g, ' ').trim();
  const firstName = (parts[1] || '').replace(/</g, ' ').trim();
  
  return { lastName, firstName };
}

/**
 * Parse TD1 format MRZ (3 lines of 30 characters each)
 * Used by most CEDEAO/UEMOA ID cards
 */
function parseTD1(lines: string[]): MRZData | null {
  if (lines.length < 3) return null;
  
  const line1 = cleanMRZLine(lines[0]);
  const line2 = cleanMRZLine(lines[1]);
  const line3 = cleanMRZLine(lines[2]);
  
  if (line1.length < 30 || line2.length < 30 || line3.length < 30) return null;
  
  // Line 1: Document code (2) + Issuing country (3) + Document number (9) + Check (1) + Optional (15)
  const documentCode = line1.substring(0, 2);
  const issuingCountry = line1.substring(2, 5);
  const documentNumber = line1.substring(5, 14).replace(/</g, '');
  const documentNumberCheck = line1[14];
  const optionalData1 = line1.substring(15, 30);
  
  // Line 2: DOB (6) + Check (1) + Sex (1) + Expiration (6) + Check (1) + Nationality (3) + Optional (11) + Composite (1)
  const dateOfBirth = line2.substring(0, 6);
  const dobCheck = line2[6];
  const sex = line2[7] as 'M' | 'F' | 'X';
  const expirationDate = line2.substring(8, 14);
  const expirationCheck = line2[14];
  const nationality = line2.substring(15, 18);
  const optionalData2 = line2.substring(18, 29);
  const compositeCheck = line2[29];
  
  // Line 3: Name
  const nameField = line3;
  const { lastName, firstName } = extractName(nameField);
  
  // Validate check digits
  const documentNumberValid = validateCheckDigit(line1.substring(5, 14), documentNumberCheck);
  const dateOfBirthValid = validateCheckDigit(dateOfBirth, dobCheck);
  const expirationDateValid = validateCheckDigit(expirationDate, expirationCheck);
  
  // Composite check: document number + check + optional1 + DOB + check + expiration + check + optional2
  const compositeData = line1.substring(5, 30) + line2.substring(0, 7) + line2.substring(8, 15) + line2.substring(18, 29);
  const compositeValid = validateCheckDigit(compositeData, compositeCheck);
  
  const isUEMOA = UEMOA_COUNTRY_CODES.includes(issuingCountry);
  const isCEDEAO = CEDEAO_COUNTRY_CODES.includes(issuingCountry);
  
  const isValid = documentNumberValid && dateOfBirthValid && expirationDateValid && compositeValid;
  
  return {
    documentType: documentCode.startsWith('I') ? 'id_card' : 'unknown',
    documentCode,
    issuingCountry,
    issuingCountryName: getCountryName(issuingCountry),
    lastName,
    firstName,
    documentNumber,
    nationality,
    nationalityName: getCountryName(nationality),
    dateOfBirth,
    dateOfBirthFormatted: formatDate(dateOfBirth),
    sex,
    expirationDate,
    expirationDateFormatted: formatDate(expirationDate),
    personalNumber: optionalData1.replace(/</g, '').trim() || optionalData2.replace(/</g, '').trim() || undefined,
    isValid,
    validationDetails: {
      documentNumberValid,
      dateOfBirthValid,
      expirationDateValid,
      compositeValid,
      isUEMOA,
      isCEDEAO,
    },
    rawMRZ: [line1, line2, line3],
    confidence: isValid ? 100 : (documentNumberValid && dateOfBirthValid ? 80 : 50),
  };
}

/**
 * Parse TD3 format MRZ (2 lines of 44 characters each)
 * Used by CEDEAO/UEMOA Passports
 */
function parseTD3(lines: string[]): MRZData | null {
  if (lines.length < 2) return null;
  
  const line1 = cleanMRZLine(lines[0]);
  const line2 = cleanMRZLine(lines[1]);
  
  if (line1.length < 44 || line2.length < 44) return null;
  
  // Line 1: P (1) + Type (1) + Issuing country (3) + Name (39)
  const documentCode = line1.substring(0, 2);
  const issuingCountry = line1.substring(2, 5);
  const nameField = line1.substring(5, 44);
  const { lastName, firstName } = extractName(nameField);
  
  // Line 2: Document number (9) + Check (1) + Nationality (3) + DOB (6) + Check (1) + Sex (1) + Expiration (6) + Check (1) + Personal number (14) + Check (1) + Composite (1)
  const documentNumber = line2.substring(0, 9).replace(/</g, '');
  const documentNumberCheck = line2[9];
  const nationality = line2.substring(10, 13);
  const dateOfBirth = line2.substring(13, 19);
  const dobCheck = line2[19];
  const sex = line2[20] as 'M' | 'F' | 'X';
  const expirationDate = line2.substring(21, 27);
  const expirationCheck = line2[27];
  const personalNumber = line2.substring(28, 42).replace(/</g, '').trim();
  const personalNumberCheck = line2[42];
  const compositeCheck = line2[43];
  
  // Validate check digits
  const documentNumberValid = validateCheckDigit(line2.substring(0, 9), documentNumberCheck);
  const dateOfBirthValid = validateCheckDigit(dateOfBirth, dobCheck);
  const expirationDateValid = validateCheckDigit(expirationDate, expirationCheck);
  
  // Composite check
  const compositeData = line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43);
  const compositeValid = validateCheckDigit(compositeData, compositeCheck);
  
  const isUEMOA = UEMOA_COUNTRY_CODES.includes(issuingCountry);
  const isCEDEAO = CEDEAO_COUNTRY_CODES.includes(issuingCountry);
  
  const isValid = documentNumberValid && dateOfBirthValid && expirationDateValid && compositeValid;
  
  return {
    documentType: 'passport',
    documentCode,
    issuingCountry,
    issuingCountryName: getCountryName(issuingCountry),
    lastName,
    firstName,
    documentNumber,
    nationality,
    nationalityName: getCountryName(nationality),
    dateOfBirth,
    dateOfBirthFormatted: formatDate(dateOfBirth),
    sex,
    expirationDate,
    expirationDateFormatted: formatDate(expirationDate),
    personalNumber: personalNumber || undefined,
    isValid,
    validationDetails: {
      documentNumberValid,
      dateOfBirthValid,
      expirationDateValid,
      compositeValid,
      isUEMOA,
      isCEDEAO,
    },
    rawMRZ: [line1, line2],
    confidence: isValid ? 100 : (documentNumberValid && dateOfBirthValid ? 80 : 50),
  };
}

/**
 * Detect MRZ lines in OCR text
 * Looks for patterns matching TD1 (3x30) or TD3 (2x44) formats
 */
function detectMRZLines(ocrText: string): string[] {
  const lines = ocrText.split('\n').map(line => line.trim());
  const mrzLines: string[] = [];
  
  // MRZ characters: A-Z, 0-9, <
  const mrzPattern = /^[A-Z0-9<]{28,46}$/;
  
  for (const line of lines) {
    const cleaned = cleanMRZLine(line);
    if (mrzPattern.test(cleaned) && cleaned.length >= 28) {
      mrzLines.push(cleaned);
    }
  }
  
  return mrzLines;
}

/**
 * Main function to parse MRZ from OCR text
 */
export function parseMRZ(ocrText: string): MRZDetectionResult {
  try {
    const mrzLines = detectMRZLines(ocrText);
    
    if (mrzLines.length === 0) {
      return {
        found: false,
        mrz: null,
        rawLines: [],
        error: 'Aucune zone MRZ détectée dans le document',
      };
    }
    
    // Try TD3 format first (passport - 2 lines of 44 chars)
    const td3Lines = mrzLines.filter(line => line.length >= 44);
    if (td3Lines.length >= 2) {
      const mrz = parseTD3(td3Lines.slice(0, 2));
      if (mrz) {
        return { found: true, mrz, rawLines: td3Lines.slice(0, 2) };
      }
    }
    
    // Try TD1 format (ID card - 3 lines of 30 chars)
    const td1Lines = mrzLines.filter(line => line.length >= 30 && line.length < 44);
    if (td1Lines.length >= 3) {
      const mrz = parseTD1(td1Lines.slice(0, 3));
      if (mrz) {
        return { found: true, mrz, rawLines: td1Lines.slice(0, 3) };
      }
    }
    
    // If we found MRZ-like lines but couldn't parse them
    return {
      found: false,
      mrz: null,
      rawLines: mrzLines,
      error: 'Zone MRZ détectée mais format non reconnu',
    };
  } catch (error) {
    return {
      found: false,
      mrz: null,
      rawLines: [],
      error: `Erreur lors du parsing MRZ: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * Validate a document number using MRZ checksum
 * Useful for quick validation without full MRZ
 */
export function validateDocumentNumber(documentNumber: string, checkDigit: string): boolean {
  const cleanNumber = documentNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return validateCheckDigit(cleanNumber, checkDigit);
}

/**
 * Generate check digit for a document number
 */
export function generateCheckDigit(data: string): number {
  return calculateCheckDigit(data.toUpperCase());
}

/**
 * Check if a country code is from UEMOA zone
 */
export function isUEMOACountry(countryCode: string): boolean {
  return UEMOA_COUNTRY_CODES.includes(countryCode.toUpperCase());
}

/**
 * Check if a country code is from CEDEAO zone
 */
export function isCEDEAOCountry(countryCode: string): boolean {
  return CEDEAO_COUNTRY_CODES.includes(countryCode.toUpperCase());
}
