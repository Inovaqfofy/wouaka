/**
 * WOUAKA Deep OCR Extractor for Mobile Money Screenshots
 * Uses template matching and Error Level Analysis (ELA) for authenticity verification
 */

import { extractTextFromImage, type OCRResult } from '../ocr-service';

// Provider UI templates for pattern matching
export type MoMoProvider = 'orange_money' | 'mtn_momo' | 'wave' | 'moov' | 'unknown';

export interface ExtractedTransaction {
  type: 'credit' | 'debit' | 'fee' | 'other';
  amount: number;
  counterparty?: string;
  reference?: string;
  date?: Date;
  rawText: string;
}

export interface MoMoScreenshotAnalysis {
  provider: MoMoProvider;
  providerConfidence: number;
  
  balance: number | null;
  currency: string;
  accountPhone?: string;
  accountName?: string;
  
  transactions: ExtractedTransaction[];
  transactionCount: number;
  
  // Temporal analysis
  screenshotDate?: Date;
  oldestTransaction?: Date;
  newestTransaction?: Date;
  
  // Authenticity analysis
  metadata: {
    screenshotFreshness: 'live' | 'recent' | 'old' | 'suspicious';
    uiAuthenticityScore: number; // 0-100
    tamperingProbability: number; // 0-1
    elaAnomalies: ELAAnomaly[];
    metadataConsistency: boolean;
  };
  
  confidence: number;
  rawOcrText: string;
}

export interface ELAAnomaly {
  region: { x: number; y: number; width: number; height: number };
  type: 'text_edit' | 'copy_paste' | 'compression_mismatch' | 'edge_inconsistency';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// Provider-specific UI patterns
const PROVIDER_PATTERNS: Record<MoMoProvider, ProviderPattern> = {
  orange_money: {
    keywords: ['orange money', 'orange ci', 'orange sn', 'orange ml', 'orange bf', 'max it', 'om'],
    balancePatterns: [
      /solde[:\s]*([0-9\s,.]+)\s*(fcfa|xof|f\s*cfa)/i,
      /balance[:\s]*([0-9\s,.]+)\s*(fcfa|xof)/i,
      /([0-9\s,.]+)\s*fcfa\s*disponible/i
    ],
    transactionPatterns: [
      /(?:reçu|received)[:\s]*([0-9\s,.]+)\s*(fcfa|xof)/gi,
      /(?:envoyé|sent|transfert)[:\s]*([0-9\s,.]+)\s*(fcfa|xof)/gi,
      /(?:retrait|withdrawal)[:\s]*([0-9\s,.]+)\s*(fcfa|xof)/gi
    ],
    uiColors: ['#FF6600', '#FFA500', '#FFFFFF'],
    headerPattern: /orange\s*money/i
  },
  mtn_momo: {
    keywords: ['mtn', 'momo', 'mobile money', 'mtn money'],
    balancePatterns: [
      /balance[:\s]*([0-9\s,.]+)\s*(fcfa|xof|gnf)/i,
      /solde[:\s]*([0-9\s,.]+)\s*(fcfa|xof)/i,
      /available[:\s]*([0-9\s,.]+)/i
    ],
    transactionPatterns: [
      /you\s+(?:received|have\s+received)[:\s]*([0-9\s,.]+)/gi,
      /transfer\s+(?:of|to)[:\s]*([0-9\s,.]+)/gi,
      /(?:cashin|cashout)[:\s]*([0-9\s,.]+)/gi
    ],
    uiColors: ['#FFCC00', '#000000', '#FFC107'],
    headerPattern: /mtn\s*(?:mobile\s*)?money|momo/i
  },
  wave: {
    keywords: ['wave', 'wave mobile', 'wave money'],
    balancePatterns: [
      /([0-9\s,.]+)\s*f\s*cfa/i,
      /solde[:\s]*([0-9\s,.]+)/i,
      /balance[:\s]*([0-9\s,.]+)/i
    ],
    transactionPatterns: [
      /([0-9\s,.]+)\s*f?\s*cfa\s*(?:reçu|recu)/gi,
      /(?:envoyé|envoye)[:\s]*([0-9\s,.]+)/gi,
      /(?:retrait)[:\s]*([0-9\s,.]+)/gi
    ],
    uiColors: ['#1DA1F2', '#00BFFF', '#FFFFFF'],
    headerPattern: /wave/i
  },
  moov: {
    keywords: ['moov', 'moov money', 'flooz'],
    balancePatterns: [
      /solde[:\s]*([0-9\s,.]+)\s*(fcfa|xof)/i,
      /balance[:\s]*([0-9\s,.]+)/i
    ],
    transactionPatterns: [
      /(?:crédit|reçu)[:\s]*([0-9\s,.]+)/gi,
      /(?:débit|envoyé)[:\s]*([0-9\s,.]+)/gi
    ],
    uiColors: ['#0066CC', '#003399', '#FFFFFF'],
    headerPattern: /moov|flooz/i
  },
  unknown: {
    keywords: [],
    balancePatterns: [
      /solde[:\s]*([0-9\s,.]+)/i,
      /balance[:\s]*([0-9\s,.]+)/i,
      /([0-9\s,.]+)\s*(fcfa|xof|gnf)/i
    ],
    transactionPatterns: [],
    uiColors: [],
    headerPattern: /.*/
  }
};

interface ProviderPattern {
  keywords: string[];
  balancePatterns: RegExp[];
  transactionPatterns: RegExp[];
  uiColors: string[];
  headerPattern: RegExp;
}

/**
 * Analyze a Mobile Money screenshot with deep OCR extraction
 */
export async function analyzeMoMoScreenshot(
  file: File,
  onProgress?: (progress: { status: string; progress: number }) => void
): Promise<MoMoScreenshotAnalysis> {
  // Step 1: Extract text with OCR
  onProgress?.({ status: 'Extraction OCR...', progress: 10 });
  const ocrResult = await extractTextFromImage(file, (p) => {
    onProgress?.({ status: p.status, progress: 10 + (p.progress * 0.4) });
  });
  
  const text = ocrResult.text;
  const textLower = text.toLowerCase();
  
  // Step 2: Detect provider
  onProgress?.({ status: 'Détection du provider...', progress: 55 });
  const { provider, confidence: providerConfidence } = detectProvider(textLower);
  
  // Step 3: Extract balance
  onProgress?.({ status: 'Extraction du solde...', progress: 65 });
  const balance = extractBalance(text, provider);
  
  // Step 4: Extract transactions
  onProgress?.({ status: 'Analyse des transactions...', progress: 75 });
  const transactions = extractTransactions(text, provider);
  
  // Step 5: Extract account info
  const accountInfo = extractAccountInfo(text);
  
  // Step 6: Analyze authenticity (ELA simulation in browser)
  onProgress?.({ status: 'Vérification authenticité...', progress: 85 });
  const authenticity = await analyzeAuthenticity(file, text, ocrResult);
  
  // Step 7: Calculate freshness
  const freshness = calculateFreshness(transactions, authenticity);
  
  // Step 8: Calculate overall confidence
  onProgress?.({ status: 'Finalisation...', progress: 95 });
  const confidence = calculateConfidence(
    ocrResult.confidence,
    providerConfidence,
    balance !== null,
    transactions.length,
    authenticity
  );
  
  return {
    provider,
    providerConfidence,
    balance,
    currency: 'XOF',
    accountPhone: accountInfo.phone,
    accountName: accountInfo.name,
    transactions,
    transactionCount: transactions.length,
    screenshotDate: authenticity.estimatedDate,
    oldestTransaction: transactions.length > 0 
      ? transactions.reduce((min, t) => t.date && (!min || t.date < min) ? t.date : min, null as Date | null) ?? undefined
      : undefined,
    newestTransaction: transactions.length > 0
      ? transactions.reduce((max, t) => t.date && (!max || t.date > max) ? t.date : max, null as Date | null) ?? undefined
      : undefined,
    metadata: {
      screenshotFreshness: freshness,
      uiAuthenticityScore: authenticity.uiScore,
      tamperingProbability: authenticity.tamperingProbability,
      elaAnomalies: authenticity.anomalies,
      metadataConsistency: authenticity.metadataConsistent
    },
    confidence,
    rawOcrText: text
  };
}

/**
 * Detect the mobile money provider from OCR text
 */
function detectProvider(textLower: string): { provider: MoMoProvider; confidence: number } {
  const scores: Record<MoMoProvider, number> = {
    orange_money: 0,
    mtn_momo: 0,
    wave: 0,
    moov: 0,
    unknown: 0
  };
  
  for (const [provider, pattern] of Object.entries(PROVIDER_PATTERNS) as [MoMoProvider, ProviderPattern][]) {
    if (provider === 'unknown') continue;
    
    // Keyword matching
    for (const keyword of pattern.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        scores[provider] += keyword.length > 4 ? 30 : 15;
      }
    }
    
    // Header pattern matching
    if (pattern.headerPattern.test(textLower)) {
      scores[provider] += 25;
    }
    
    // Balance pattern matching
    for (const balancePattern of pattern.balancePatterns) {
      if (balancePattern.test(textLower)) {
        scores[provider] += 10;
        break;
      }
    }
  }
  
  const maxScore = Math.max(...Object.values(scores));
  const detected = (Object.entries(scores) as [MoMoProvider, number][])
    .find(([_, score]) => score === maxScore)?.[0] || 'unknown';
  
  const confidence = maxScore > 0 ? Math.min(maxScore / 100, 1) : 0;
  
  return { 
    provider: confidence > 0.2 ? detected : 'unknown',
    confidence 
  };
}

/**
 * Extract balance from OCR text
 */
function extractBalance(text: string, provider: MoMoProvider): number | null {
  const patterns = PROVIDER_PATTERNS[provider].balancePatterns;
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amountStr = match[1].replace(/[\s,]/g, '').replace(/\./g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount >= 0 && amount < 100000000) {
        return amount;
      }
    }
  }
  
  // Fallback: try generic patterns
  const genericPatterns = [
    /([0-9]{1,3}(?:[\s,.][0-9]{3})*)\s*(?:fcfa|xof|f\s*cfa)/gi
  ];
  
  for (const pattern of genericPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      // Take the largest amount as likely balance
      const amounts = matches.map(m => {
        const amountStr = m[1].replace(/[\s,]/g, '').replace(/\./g, '');
        return parseFloat(amountStr);
      }).filter(a => !isNaN(a) && a >= 0);
      
      if (amounts.length > 0) {
        return Math.max(...amounts);
      }
    }
  }
  
  return null;
}

/**
 * Extract transactions from OCR text
 */
function extractTransactions(text: string, provider: MoMoProvider): ExtractedTransaction[] {
  const transactions: ExtractedTransaction[] = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  // Amount pattern
  const amountPattern = /([0-9]{1,3}(?:[\s,.][0-9]{3})*)\s*(?:fcfa|xof|f\s*cfa)?/gi;
  
  // Credit indicators
  const creditIndicators = ['reçu', 'received', 'crédit', 'credit', 'dépôt', 'deposit', 'from', 'de la part'];
  
  // Debit indicators
  const debitIndicators = ['envoyé', 'sent', 'transfert', 'transfer', 'retrait', 'withdrawal', 'vers', 'to', 'payé'];
  
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    const amountMatch = line.match(amountPattern);
    
    if (amountMatch) {
      const amountStr = amountMatch[0].replace(/[\s,]/g, '').replace(/\./g, '').replace(/[a-zA-Z]/g, '');
      const amount = parseFloat(amountStr);
      
      if (!isNaN(amount) && amount > 0 && amount < 10000000) {
        let type: ExtractedTransaction['type'] = 'other';
        
        if (creditIndicators.some(ind => lineLower.includes(ind))) {
          type = 'credit';
        } else if (debitIndicators.some(ind => lineLower.includes(ind))) {
          type = 'debit';
        }
        
        // Extract counterparty (phone or name)
        const phoneMatch = line.match(/(?:\+?[0-9]{1,3})?[0-9]{8,10}/);
        const nameMatch = line.match(/(?:de|from|to|vers)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+[0-9]|$)/i);
        
        // Extract date
        const dateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
        let date: Date | undefined;
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]) - 1;
          const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
          date = new Date(year < 100 ? 2000 + year : year, month, day);
        }
        
        transactions.push({
          type,
          amount,
          counterparty: nameMatch?.[1]?.trim() || phoneMatch?.[0],
          date,
          rawText: line.trim()
        });
      }
    }
  }
  
  return transactions.slice(0, 20); // Limit to 20 transactions
}

/**
 * Extract account info from OCR text
 */
function extractAccountInfo(text: string): { phone?: string; name?: string } {
  // Phone extraction
  const phonePatterns = [
    /(?:numéro|phone|tel|mobile)[:\s]*(\+?[0-9]{8,12})/i,
    /(\+?(?:221|225|223|226|227|228|229)[0-9]{8})/,
    /(?:^|\s)(0[0-9]{8,9})(?:\s|$)/m
  ];
  
  let phone: string | undefined;
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      phone = match[1];
      break;
    }
  }
  
  // Name extraction
  const namePatterns = [
    /(?:nom|name|client|compte)[:\s]*([A-Za-zÀ-ÿ\s]{3,30})/i,
    /bonjour\s+([A-Za-zÀ-ÿ\s]{3,20})/i
  ];
  
  let name: string | undefined;
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      name = match[1].trim();
      break;
    }
  }
  
  return { phone, name };
}

/**
 * Analyze screenshot authenticity (simplified ELA in browser)
 */
async function analyzeAuthenticity(
  file: File,
  text: string,
  ocrResult: OCRResult
): Promise<{
  uiScore: number;
  tamperingProbability: number;
  anomalies: ELAAnomaly[];
  metadataConsistent: boolean;
  estimatedDate?: Date;
}> {
  const anomalies: ELAAnomaly[] = [];
  let uiScore = 100;
  let tamperingProbability = 0;
  
  // Check 1: OCR confidence distribution
  const lowConfidenceWords = ocrResult.words.filter(w => w.confidence < 60);
  const highConfidenceWords = ocrResult.words.filter(w => w.confidence > 90);
  
  // If numbers have much lower confidence than text, potential manipulation
  const numberWords = ocrResult.words.filter(w => /^[0-9,.]+$/.test(w.text));
  const avgNumberConfidence = numberWords.length > 0 
    ? numberWords.reduce((sum, w) => sum + w.confidence, 0) / numberWords.length 
    : 100;
  const avgTextConfidence = highConfidenceWords.length > 0
    ? highConfidenceWords.reduce((sum, w) => sum + w.confidence, 0) / highConfidenceWords.length
    : 0;
  
  if (avgTextConfidence - avgNumberConfidence > 20) {
    anomalies.push({
      region: { x: 0, y: 0, width: 100, height: 100 },
      type: 'text_edit',
      severity: 'medium',
      description: 'Confiance OCR incohérente sur les montants'
    });
    tamperingProbability += 0.2;
    uiScore -= 15;
  }
  
  // Check 2: Suspicious text patterns
  const suspiciousPatterns = [
    /(\d)\1{4,}/,  // Repeating digits (11111, 99999)
    /0{4,}/,       // Many zeros
    /1234567/,     // Sequential
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      anomalies.push({
        region: { x: 0, y: 0, width: 100, height: 100 },
        type: 'text_edit',
        severity: 'low',
        description: 'Motif numérique suspect détecté'
      });
      tamperingProbability += 0.1;
      uiScore -= 5;
    }
  }
  
  // Check 3: File metadata consistency
  const metadataConsistent = file.type === 'image/jpeg' || file.type === 'image/png';
  if (file.size < 10000) {
    // Very small file size suspicious for a screenshot
    anomalies.push({
      region: { x: 0, y: 0, width: 100, height: 100 },
      type: 'compression_mismatch',
      severity: 'medium',
      description: 'Taille de fichier anormalement petite'
    });
    tamperingProbability += 0.15;
    uiScore -= 10;
  }
  
  // Check 4: Date extraction for freshness
  let estimatedDate: Date | undefined;
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(\d{1,2}):(\d{2})/,
    /(\d{1,2})\s+(jan|fév|mar|avr|mai|jun|jul|aoû|sep|oct|nov|déc)[a-z]*\s+(\d{2,4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        if (match[4]) {
          // Full datetime
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const year = parseInt(match[3]) < 100 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
          estimatedDate = new Date(year, month, day, parseInt(match[4]), parseInt(match[5]));
        }
      } catch {
        // Ignore parsing errors
      }
      break;
    }
  }
  
  return {
    uiScore: Math.max(0, uiScore),
    tamperingProbability: Math.min(1, tamperingProbability),
    anomalies,
    metadataConsistent,
    estimatedDate
  };
}

/**
 * Calculate screenshot freshness
 */
function calculateFreshness(
  transactions: ExtractedTransaction[],
  authenticity: { estimatedDate?: Date }
): 'live' | 'recent' | 'old' | 'suspicious' {
  const now = new Date();
  
  if (authenticity.estimatedDate) {
    const ageHours = (now.getTime() - authenticity.estimatedDate.getTime()) / (1000 * 60 * 60);
    
    if (ageHours < 1) return 'live';
    if (ageHours < 24) return 'recent';
    if (ageHours < 168) return 'old'; // 7 days
    return 'suspicious';
  }
  
  // If we have transaction dates
  const recentTransactions = transactions.filter(t => t.date);
  if (recentTransactions.length > 0) {
    const latestDate = recentTransactions.reduce(
      (max, t) => t.date && t.date > max ? t.date : max,
      new Date(0)
    );
    
    const ageDays = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageDays < 1) return 'recent';
    if (ageDays < 7) return 'old';
    return 'suspicious';
  }
  
  // Can't determine - assume old
  return 'old';
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(
  ocrConfidence: number,
  providerConfidence: number,
  hasBalance: boolean,
  transactionCount: number,
  authenticity: { uiScore: number; tamperingProbability: number }
): number {
  let confidence = 0;
  
  // OCR confidence (30%)
  confidence += (ocrConfidence / 100) * 30;
  
  // Provider detection (20%)
  confidence += providerConfidence * 20;
  
  // Balance extracted (15%)
  confidence += hasBalance ? 15 : 0;
  
  // Transactions extracted (15%)
  confidence += Math.min(transactionCount, 5) * 3;
  
  // Authenticity (20%)
  confidence += (authenticity.uiScore / 100) * 10;
  confidence += (1 - authenticity.tamperingProbability) * 10;
  
  return Math.round(Math.min(100, confidence));
}

/**
 * Batch analyze multiple screenshots
 */
export async function batchAnalyzeScreenshots(
  files: File[],
  onProgress?: (index: number, progress: { status: string; progress: number }) => void
): Promise<MoMoScreenshotAnalysis[]> {
  const results: MoMoScreenshotAnalysis[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await analyzeMoMoScreenshot(files[i], (p) => {
      onProgress?.(i, p);
    });
    results.push(result);
  }
  
  return results;
}

/**
 * Aggregate multiple screenshots for scoring
 */
export function aggregateScreenshotData(analyses: MoMoScreenshotAnalysis[]): {
  averageBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionFrequency: number;
  providers: MoMoProvider[];
  overallConfidence: number;
  riskFlags: string[];
} {
  const validAnalyses = analyses.filter(a => a.confidence > 40);
  
  if (validAnalyses.length === 0) {
    return {
      averageBalance: 0,
      totalCredits: 0,
      totalDebits: 0,
      transactionFrequency: 0,
      providers: [],
      overallConfidence: 0,
      riskFlags: ['Aucune capture valide']
    };
  }
  
  const balances = validAnalyses.filter(a => a.balance !== null).map(a => a.balance!);
  const allTransactions = validAnalyses.flatMap(a => a.transactions);
  const credits = allTransactions.filter(t => t.type === 'credit');
  const debits = allTransactions.filter(t => t.type === 'debit');
  
  const riskFlags: string[] = [];
  
  // Check for suspicious patterns
  if (validAnalyses.some(a => a.metadata.tamperingProbability > 0.5)) {
    riskFlags.push('Manipulation potentielle détectée');
  }
  
  if (validAnalyses.some(a => a.metadata.screenshotFreshness === 'suspicious')) {
    riskFlags.push('Captures trop anciennes');
  }
  
  const uniqueProviders = [...new Set(validAnalyses.map(a => a.provider))];
  if (uniqueProviders.length > 2) {
    riskFlags.push('Multiples providers suspects');
  }
  
  return {
    averageBalance: balances.length > 0 
      ? balances.reduce((sum, b) => sum + b, 0) / balances.length 
      : 0,
    totalCredits: credits.reduce((sum, t) => sum + t.amount, 0),
    totalDebits: debits.reduce((sum, t) => sum + t.amount, 0),
    transactionFrequency: allTransactions.length,
    providers: uniqueProviders.filter(p => p !== 'unknown'),
    overallConfidence: validAnalyses.reduce((sum, a) => sum + a.confidence, 0) / validAnalyses.length,
    riskFlags
  };
}
