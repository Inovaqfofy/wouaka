/**
 * WOUAKA SMS Transaction Extractor
 * Client-side NLP parser for Mobile Money SMS
 * All processing is LOCAL - no SMS content sent to servers
 */

import { parseSms, parseSmsMessages, aggregateSmsData, type ParsedSms } from '@/lib/ocr/sms-parser';

export interface SmsMessage {
  id: string;
  sender: string;
  body: string;
  date: Date;
  read: boolean;
}

export interface ExtractedTransaction {
  id: string;
  provider: string;
  type: 'credit' | 'debit' | 'balance' | 'other';
  amount: number;
  currency: string;
  balanceAfter?: number;
  counterparty?: string;
  reference?: string;
  date: Date;
  confidence: number;
  sourceType: 'sms_parsed';
}

export interface UtilityBill {
  id: string;
  utilityType: 'electricity' | 'water' | 'internet' | 'rent' | 'other';
  providerName: string;
  amount: number;
  billDate?: Date;
  dueDate?: Date;
  paidDate?: Date;
  paymentStatus: 'unpaid' | 'paid_on_time' | 'paid_late';
  reference?: string;
  confidence: number;
  sourceType: 'sms_parsed';
}

export interface ExtractionResult {
  transactions: ExtractedTransaction[];
  utilityBills: UtilityBill[];
  aggregated: {
    totalCredits: number;
    totalDebits: number;
    creditCount: number;
    debitCount: number;
    averageTransaction: number;
    providers: string[];
    latestBalance?: number;
    activityLevel: string;
    confidence: number;
    oldestTransaction?: Date;
    phoneAgeMonths?: number;
  };
  processingStats: {
    totalSms: number;
    parsedSms: number;
    utilityBillsFound: number;
    processingTimeMs: number;
  };
}

// Known SMS senders for Mobile Money
const MOMO_SENDERS = [
  'orangemoney', 'orange money', '30303', '144', 'om',
  'mtn', 'momo', 'mtn momo', '5050', '170',
  'wave', 'wavemobile',
  'moov', 'flooz', 'moov money',
];

// Known utility company SMS senders
const UTILITY_SENDERS: Record<string, { type: 'electricity' | 'water' | 'internet' | 'other'; name: string }> = {
  'cie': { type: 'electricity', name: 'CIE' },
  'sodeci': { type: 'water', name: 'SODECI' },
  'senelec': { type: 'electricity', name: 'SENELEC' },
  'sde': { type: 'water', name: 'SDE' },
  'orange': { type: 'internet', name: 'Orange Internet' },
  'mtn': { type: 'internet', name: 'MTN Internet' },
  'canal+': { type: 'other', name: 'Canal+' },
  'startime': { type: 'other', name: 'StarTimes' },
};

// Utility bill patterns
const UTILITY_PATTERNS = [
  {
    regex: /(?:facture|bill)\s*(?:n[°o]?)?\s*:?\s*(\w+)?.*?(?:montant|amount)\s*:?\s*([\d\s,.]+)\s*(?:fcfa|xof)?/i,
    extract: (m: RegExpMatchArray) => ({
      reference: m[1],
      amount: parseFloat(m[2].replace(/[\s,]/g, '')),
    }),
  },
  {
    regex: /(?:paiement|payment)\s*(?:facture|bill)\s*(cie|sodeci|senelec|sde).*?([\d\s,.]+)\s*(?:fcfa|xof)?/i,
    extract: (m: RegExpMatchArray) => ({
      providerHint: m[1].toLowerCase(),
      amount: parseFloat(m[2].replace(/[\s,]/g, '')),
    }),
  },
  {
    regex: /(?:électricité|electricite|eau|water)\s*:?\s*([\d\s,.]+)\s*(?:fcfa|xof)?/i,
    extract: (m: RegExpMatchArray) => ({
      amount: parseFloat(m[1].replace(/[\s,]/g, '')),
    }),
  },
];

/**
 * Filter SMS messages to only MoMo-related ones
 */
function filterMoMoSms(messages: SmsMessage[]): SmsMessage[] {
  return messages.filter(sms => {
    const sender = sms.sender.toLowerCase();
    return MOMO_SENDERS.some(ms => sender.includes(ms));
  });
}

/**
 * Filter SMS messages for utility bills
 */
function filterUtilitySms(messages: SmsMessage[]): SmsMessage[] {
  return messages.filter(sms => {
    const sender = sms.sender.toLowerCase();
    const body = sms.body.toLowerCase();
    
    // Check sender
    const isUtilitySender = Object.keys(UTILITY_SENDERS).some(u => sender.includes(u));
    
    // Check content for utility keywords
    const hasUtilityKeywords = /facture|bill|électricité|electricite|eau|water|abonnement|recharge/i.test(body);
    
    return isUtilitySender || hasUtilityKeywords;
  });
}

/**
 * Extract utility bills from SMS
 */
function extractUtilityBills(messages: SmsMessage[]): UtilityBill[] {
  const bills: UtilityBill[] = [];
  
  for (const sms of messages) {
    const sender = sms.sender.toLowerCase();
    
    // Detect utility type from sender
    let utilityInfo = Object.entries(UTILITY_SENDERS).find(([key]) => sender.includes(key))?.[1];
    
    // Try each pattern
    for (const pattern of UTILITY_PATTERNS) {
      const match = sms.body.match(pattern.regex);
      if (match) {
        const extracted = pattern.extract(match);
        
        // Use provider hint if available
        if ('providerHint' in extracted && typeof extracted.providerHint === 'string') {
          utilityInfo = UTILITY_SENDERS[extracted.providerHint as keyof typeof UTILITY_SENDERS] || utilityInfo;
        }
        
        if (extracted.amount && extracted.amount > 0) {
          // Determine if payment or bill
          const isPaid = /pay[ée]|r[ée]ussi|succ[eè]s|confirm[ée]/i.test(sms.body);
          
          bills.push({
            id: sms.id,
            utilityType: utilityInfo?.type || 'other',
            providerName: utilityInfo?.name || 'Inconnu',
            amount: extracted.amount,
            billDate: sms.date,
            paidDate: isPaid ? sms.date : undefined,
            paymentStatus: isPaid ? 'paid_on_time' : 'unpaid',
            reference: 'reference' in extracted ? extracted.reference as string : undefined,
            confidence: 70,
            sourceType: 'sms_parsed',
          });
          
          break; // Found a match, move to next SMS
        }
      }
    }
  }
  
  return bills;
}

/**
 * Convert ParsedSms to ExtractedTransaction
 */
function toExtractedTransaction(parsed: ParsedSms, originalId: string): ExtractedTransaction {
  return {
    id: originalId,
    provider: parsed.provider,
    type: parsed.transactionType === 'fee' ? 'debit' : parsed.transactionType,
    amount: parsed.amount,
    currency: parsed.currency,
    balanceAfter: parsed.balanceAfter,
    counterparty: parsed.counterpartyName || parsed.counterpartyPhone,
    reference: parsed.reference,
    date: parsed.smsDate || new Date(),
    confidence: parsed.parseConfidence,
    sourceType: 'sms_parsed',
  };
}

/**
 * Calculate phone age from oldest transaction
 */
function calculatePhoneAge(transactions: ExtractedTransaction[]): number | undefined {
  if (transactions.length === 0) return undefined;
  
  const dates = transactions.map(t => t.date.getTime()).filter(d => !isNaN(d));
  if (dates.length === 0) return undefined;
  
  const oldest = Math.min(...dates);
  const now = Date.now();
  const ageMs = now - oldest;
  const ageMonths = Math.floor(ageMs / (30 * 24 * 60 * 60 * 1000));
  
  return ageMonths;
}

/**
 * Main extraction function
 * Processes all SMS locally and extracts structured financial data
 */
export function extractFromSmsMessages(messages: SmsMessage[]): ExtractionResult {
  const startTime = Date.now();
  
  // Filter and parse MoMo SMS
  const momoSms = filterMoMoSms(messages);
  const parsedResults = parseSmsMessages(
    momoSms.map(sms => ({
      text: sms.body,
      sender: sms.sender,
      date: sms.date,
    }))
  );
  
  // Convert to transactions
  const transactions: ExtractedTransaction[] = parsedResults.map((parsed, index) => 
    toExtractedTransaction(parsed, momoSms[index]?.id || `tx-${index}`)
  );
  
  // Extract utility bills
  const utilitySms = filterUtilitySms(messages);
  const utilityBills = extractUtilityBills(utilitySms);
  
  // Aggregate data
  const aggregated = aggregateSmsData(parsedResults);
  const phoneAgeMonths = calculatePhoneAge(transactions);
  
  return {
    transactions,
    utilityBills,
    aggregated: {
      totalCredits: aggregated.totalCredits,
      totalDebits: aggregated.totalDebits,
      creditCount: aggregated.creditCount,
      debitCount: aggregated.debitCount,
      averageTransaction: aggregated.averageTransaction,
      providers: aggregated.providers,
      latestBalance: aggregated.latestBalance,
      activityLevel: aggregated.transactionFrequency,
      confidence: aggregated.confidence,
      oldestTransaction: transactions.length > 0 
        ? new Date(Math.min(...transactions.map(t => t.date.getTime())))
        : undefined,
      phoneAgeMonths,
    },
    processingStats: {
      totalSms: messages.length,
      parsedSms: parsedResults.length,
      utilityBillsFound: utilityBills.length,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * Calculate data certainty coefficient based on source and certification
 */
export function calculateCertaintyCoefficient(
  sourceType: 'sms_parsed' | 'screenshot_ocr' | 'declared',
  isCertified: boolean,
  additionalFactors: {
    phoneOtpVerified?: boolean;
    providerDetected?: boolean;
    nameCrossValidated?: boolean;
  } = {}
): number {
  // Base coefficients from data_source_certainty table
  const baseCoefficients: Record<string, { base: number; certified: number }> = {
    'sms_parsed': { base: 0.7, certified: 0.9 },
    'screenshot_ocr': { base: 0.6, certified: 0.9 },
    'declared': { base: 0.3, certified: 0.5 },
  };
  
  const coefficients = baseCoefficients[sourceType] || { base: 0.3, certified: 0.5 };
  let certainty = isCertified ? coefficients.certified : coefficients.base;
  
  // Adjust based on additional factors
  if (additionalFactors.phoneOtpVerified) {
    certainty = Math.min(1.0, certainty + 0.05);
  }
  if (additionalFactors.providerDetected) {
    certainty = Math.min(1.0, certainty + 0.03);
  }
  if (additionalFactors.nameCrossValidated) {
    certainty = Math.min(1.0, certainty + 0.07);
  }
  
  return certainty;
}
