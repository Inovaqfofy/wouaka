/**
 * WOUAKA SMS Parser for Mobile Money Confirmations
 * Parses SMS messages from Orange Money, MTN MoMo, Wave, Moov
 */

export type SmsProvider = 'orange_money' | 'mtn_momo' | 'wave' | 'moov' | 'unknown';
export type TransactionType = 'credit' | 'debit' | 'balance' | 'fee' | 'other';

export interface ParsedSms {
  provider: SmsProvider;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  balanceAfter?: number;
  counterpartyName?: string;
  counterpartyPhone?: string;
  reference?: string;
  smsDate?: Date;
  parseConfidence: number;
  patternMatched: string;
  rawText: string;
}

export interface SmsPattern {
  name: string;
  provider: SmsProvider;
  regex: RegExp;
  transactionType: TransactionType;
  extract: (match: RegExpMatchArray) => Partial<ParsedSms>;
}

// Comprehensive SMS patterns for UEMOA providers
const SMS_PATTERNS: SmsPattern[] = [
  // ============= ORANGE MONEY =============
  {
    name: 'orange_credit_fr',
    provider: 'orange_money',
    regex: /vous avez re[çc]u (\d[\d\s,.]*)\s*(?:fcfa|xof|f\s*cfa)?\s*(?:de|from)\s+([^.]+?)\.?\s*(?:nouveau\s+)?solde[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'credit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim(),
      balanceAfter: parseAmount(m[3])
    })
  },
  {
    name: 'orange_debit_fr',
    provider: 'orange_money',
    regex: /(?:transfert|envoi)\s*(?:de)?\s*(\d[\d\s,.]*)\s*(?:fcfa|xof)?\s*(?:vers|[àa])\s+([^.]+?)\.?\s*(?:effectu[ée]|r[ée]ussi).*?solde[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'debit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim(),
      balanceAfter: parseAmount(m[3])
    })
  },
  {
    name: 'orange_retrait',
    provider: 'orange_money',
    regex: /retrait\s*(?:de)?\s*(\d[\d\s,.]*)\s*(?:fcfa|xof)?.*?(?:effectu[ée]|r[ée]ussi).*?solde[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'debit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      balanceAfter: parseAmount(m[2])
    })
  },
  {
    name: 'orange_depot',
    provider: 'orange_money',
    regex: /d[ée]p[oô]t\s*(?:de)?\s*(\d[\d\s,.]*)\s*(?:fcfa|xof)?.*?(?:effectu[ée]|r[ée]ussi).*?solde[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'credit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      balanceAfter: parseAmount(m[2])
    })
  },
  {
    name: 'orange_balance',
    provider: 'orange_money',
    regex: /(?:votre\s+)?solde\s*(?:est\s+de|:)\s*(\d[\d\s,.]*)\s*(?:fcfa|xof)/i,
    transactionType: 'balance',
    extract: (m) => ({
      balanceAfter: parseAmount(m[1]),
      amount: 0
    })
  },
  
  // ============= MTN MOMO =============
  {
    name: 'mtn_credit_en',
    provider: 'mtn_momo',
    regex: /you\s+(?:have\s+)?received\s+(\d[\d\s,.]*)\s*(?:xof|fcfa|gnf)?\s*from\s+([^.]+?)\.?\s*(?:your\s+)?(?:new\s+)?balance[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'credit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim(),
      balanceAfter: parseAmount(m[3])
    })
  },
  {
    name: 'mtn_debit_en',
    provider: 'mtn_momo',
    regex: /(?:transfer|payment)\s+(?:of)?\s*(\d[\d\s,.]*)\s*(?:xof|fcfa)?\s*(?:to|vers)\s+([^.]+?)\.?\s*(?:successful|completed).*?balance[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'debit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim(),
      balanceAfter: parseAmount(m[3])
    })
  },
  {
    name: 'mtn_cashin',
    provider: 'mtn_momo',
    regex: /cash\s*in\s*(?:of)?\s*(\d[\d\s,.]*)\s*(?:xof|fcfa)?.*?(?:successful|completed).*?balance[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'credit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      balanceAfter: parseAmount(m[2])
    })
  },
  {
    name: 'mtn_cashout',
    provider: 'mtn_momo',
    regex: /cash\s*out\s*(?:of)?\s*(\d[\d\s,.]*)\s*(?:xof|fcfa)?.*?(?:successful|completed).*?balance[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'debit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      balanceAfter: parseAmount(m[2])
    })
  },
  {
    name: 'mtn_credit_fr',
    provider: 'mtn_momo',
    regex: /vous avez re[çc]u (\d[\d\s,.]*)\s*(?:fcfa|xof)?\s*(?:de)\s+([^.]+?)\.?\s*solde[:\s]*(\d[\d\s,.]*)/i,
    transactionType: 'credit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim(),
      balanceAfter: parseAmount(m[3])
    })
  },
  
  // ============= WAVE =============
  {
    name: 'wave_credit',
    provider: 'wave',
    regex: /(\d[\d\s,.]*)\s*f?\s*cfa\s*re[çc]us?\s*(?:de)\s+([^.]+)/i,
    transactionType: 'credit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim()
    })
  },
  {
    name: 'wave_debit',
    provider: 'wave',
    regex: /(\d[\d\s,.]*)\s*f?\s*cfa\s*(?:envoy[ée]s?|transf[ée]r[ée]s?)\s*(?:[àa]|vers)\s+([^.]+)/i,
    transactionType: 'debit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim()
    })
  },
  {
    name: 'wave_payment',
    provider: 'wave',
    regex: /paiement\s*(?:de)?\s*(\d[\d\s,.]*)\s*f?\s*cfa\s*(?:[àa]|chez)\s+([^.]+)/i,
    transactionType: 'debit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim()
    })
  },
  {
    name: 'wave_balance',
    provider: 'wave',
    regex: /solde\s*wave[:\s]*(\d[\d\s,.]*)\s*f?\s*cfa/i,
    transactionType: 'balance',
    extract: (m) => ({
      balanceAfter: parseAmount(m[1]),
      amount: 0
    })
  },
  
  // ============= MOOV / FLOOZ =============
  {
    name: 'moov_credit',
    provider: 'moov',
    regex: /(?:flooz|moov)\s*:?\s*(?:cr[ée]dit|re[çc]u)\s*(\d[\d\s,.]*)\s*(?:fcfa|xof)?.*?(?:de)\s+([^.]+)/i,
    transactionType: 'credit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim()
    })
  },
  {
    name: 'moov_debit',
    provider: 'moov',
    regex: /(?:flooz|moov)\s*:?\s*(?:d[ée]bit|envoy[ée])\s*(\d[\d\s,.]*)\s*(?:fcfa|xof)?.*?(?:vers|[àa])\s+([^.]+)/i,
    transactionType: 'debit',
    extract: (m) => ({
      amount: parseAmount(m[1]),
      counterpartyName: m[2]?.trim()
    })
  },
  
  // ============= GENERIC PATTERNS =============
  {
    name: 'generic_credit',
    provider: 'unknown',
    regex: /(?:re[çc]u|received|cr[ée]dit)\s*:?\s*(\d[\d\s,.]*)\s*(?:fcfa|xof|gnf|f\s*cfa)/i,
    transactionType: 'credit',
    extract: (m) => ({
      amount: parseAmount(m[1])
    })
  },
  {
    name: 'generic_debit',
    provider: 'unknown',
    regex: /(?:envoy[ée]|sent|d[ée]bit|transfert)\s*:?\s*(\d[\d\s,.]*)\s*(?:fcfa|xof|gnf|f\s*cfa)/i,
    transactionType: 'debit',
    extract: (m) => ({
      amount: parseAmount(m[1])
    })
  }
];

// Sender shortcodes for provider detection
const SENDER_SHORTCODES: Record<string, SmsProvider> = {
  '30303': 'orange_money',
  '144': 'orange_money',
  'orangemoney': 'orange_money',
  'orange money': 'orange_money',
  'om': 'orange_money',
  '5050': 'mtn_momo',
  'mtn': 'mtn_momo',
  'momo': 'mtn_momo',
  'mtn momo': 'mtn_momo',
  'wave': 'wave',
  'wavemobile': 'wave',
  'moov': 'moov',
  'flooz': 'moov'
};

/**
 * Parse a single SMS message
 */
export function parseSms(
  smsText: string,
  senderShortcode?: string,
  smsDate?: Date
): ParsedSms | null {
  const text = smsText.trim();
  if (!text || text.length < 10) {
    return null;
  }
  
  // Try to detect provider from sender
  let detectedProvider: SmsProvider = 'unknown';
  if (senderShortcode) {
    const normalizedSender = senderShortcode.toLowerCase().trim();
    detectedProvider = SENDER_SHORTCODES[normalizedSender] || 'unknown';
  }
  
  // Try each pattern
  for (const pattern of SMS_PATTERNS) {
    // If we detected a provider from sender, prioritize matching patterns
    if (detectedProvider !== 'unknown' && pattern.provider !== detectedProvider && pattern.provider !== 'unknown') {
      continue;
    }
    
    const match = text.match(pattern.regex);
    if (match) {
      const extracted = pattern.extract(match);
      
      // Extract phone number from counterparty if present
      let counterpartyPhone: string | undefined;
      if (extracted.counterpartyName) {
        const phoneMatch = extracted.counterpartyName.match(/(\+?[0-9]{8,12})/);
        if (phoneMatch) {
          counterpartyPhone = phoneMatch[1];
          // Clean name from phone
          extracted.counterpartyName = extracted.counterpartyName
            .replace(phoneMatch[1], '')
            .trim()
            .replace(/^[-\s:]+|[-\s:]+$/g, '');
        }
      }
      
      // Extract transaction reference
      const refMatch = text.match(/(?:r[ée]f|ref|id|txn)[:\s#]*([A-Z0-9]{6,20})/i);
      
      return {
        provider: pattern.provider !== 'unknown' ? pattern.provider : detectedProvider,
        transactionType: pattern.transactionType,
        amount: extracted.amount || 0,
        currency: 'XOF',
        balanceAfter: extracted.balanceAfter,
        counterpartyName: extracted.counterpartyName || undefined,
        counterpartyPhone,
        reference: refMatch?.[1],
        smsDate,
        parseConfidence: calculateParseConfidence(pattern, extracted, text),
        patternMatched: pattern.name,
        rawText: text
      };
    }
  }
  
  // Try generic amount extraction as fallback
  const genericAmount = text.match(/(\d[\d\s,.]{2,15})\s*(?:fcfa|xof|gnf|f\s*cfa)/i);
  if (genericAmount) {
    const amount = parseAmount(genericAmount[1]);
    if (amount > 0) {
      // Determine type from context
      const isCredit = /re[çc]u|received|cr[ée]dit|d[ée]p[oô]t|from/i.test(text);
      const isDebit = /envoy[ée]|sent|d[ée]bit|retrait|vers|to|paiement/i.test(text);
      
      return {
        provider: detectedProvider,
        transactionType: isCredit ? 'credit' : (isDebit ? 'debit' : 'other'),
        amount,
        currency: 'XOF',
        smsDate,
        parseConfidence: 40,
        patternMatched: 'generic_fallback',
        rawText: text
      };
    }
  }
  
  return null;
}

/**
 * Parse multiple SMS messages
 */
export function parseSmsMessages(
  messages: Array<{ text: string; sender?: string; date?: Date }>
): ParsedSms[] {
  return messages
    .map(msg => parseSms(msg.text, msg.sender, msg.date))
    .filter((result): result is ParsedSms => result !== null);
}

/**
 * Aggregate SMS data for scoring
 */
export function aggregateSmsData(messages: ParsedSms[]): {
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  averageTransaction: number;
  largestCredit: number;
  largestDebit: number;
  providers: SmsProvider[];
  latestBalance?: number;
  transactionFrequency: string;
  confidence: number;
  riskFlags: string[];
} {
  const credits = messages.filter(m => m.transactionType === 'credit');
  const debits = messages.filter(m => m.transactionType === 'debit');
  const balanceMessages = messages.filter(m => m.transactionType === 'balance');
  
  const totalCredits = credits.reduce((sum, m) => sum + m.amount, 0);
  const totalDebits = debits.reduce((sum, m) => sum + m.amount, 0);
  
  const allAmounts = [...credits, ...debits].map(m => m.amount);
  const averageTransaction = allAmounts.length > 0
    ? allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length
    : 0;
  
  const providers = [...new Set(messages.map(m => m.provider))].filter(p => p !== 'unknown');
  
  // Get latest balance from balance messages or messages with balanceAfter
  const balances = [
    ...balanceMessages.map(m => ({ balance: m.balanceAfter, date: m.smsDate })),
    ...messages.filter(m => m.balanceAfter).map(m => ({ balance: m.balanceAfter, date: m.smsDate }))
  ].filter(b => b.balance !== undefined);
  
  const latestBalance = balances.length > 0
    ? balances.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0]?.balance
    : undefined;
  
  // Determine transaction frequency
  let transactionFrequency: string;
  const txCount = credits.length + debits.length;
  if (txCount >= 20) {
    transactionFrequency = 'Très actif';
  } else if (txCount >= 10) {
    transactionFrequency = 'Actif';
  } else if (txCount >= 5) {
    transactionFrequency = 'Modéré';
  } else {
    transactionFrequency = 'Faible';
  }
  
  // Calculate overall confidence
  const avgConfidence = messages.length > 0
    ? messages.reduce((sum, m) => sum + m.parseConfidence, 0) / messages.length
    : 0;
  
  // Risk flags
  const riskFlags: string[] = [];
  
  if (messages.length < 5) {
    riskFlags.push('Volume de données insuffisant');
  }
  
  if (totalDebits > totalCredits * 2) {
    riskFlags.push('Ratio débit/crédit élevé');
  }
  
  const unknownProviders = messages.filter(m => m.provider === 'unknown').length;
  if (unknownProviders > messages.length * 0.5) {
    riskFlags.push('Providers non identifiés');
  }
  
  const lowConfidence = messages.filter(m => m.parseConfidence < 50).length;
  if (lowConfidence > messages.length * 0.3) {
    riskFlags.push('Confiance parsing faible');
  }
  
  return {
    totalCredits,
    totalDebits,
    creditCount: credits.length,
    debitCount: debits.length,
    averageTransaction,
    largestCredit: credits.length > 0 ? Math.max(...credits.map(c => c.amount)) : 0,
    largestDebit: debits.length > 0 ? Math.max(...debits.map(d => d.amount)) : 0,
    providers,
    latestBalance,
    transactionFrequency,
    confidence: avgConfidence,
    riskFlags
  };
}

// ============= UTILITY FUNCTIONS =============

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  
  // Remove spaces, replace comma with dot, remove non-numeric except dots
  const cleaned = amountStr
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .replace(/\.(?=.*\.)/g, '') // Keep only last dot
    .replace(/[^\d.]/g, '');
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
}

/**
 * Calculate parse confidence
 */
function calculateParseConfidence(
  pattern: SmsPattern,
  extracted: Partial<ParsedSms>,
  text: string
): number {
  let confidence = 50; // Base confidence
  
  // Named pattern bonus
  if (pattern.provider !== 'unknown') {
    confidence += 15;
  }
  
  // Amount extracted
  if (extracted.amount && extracted.amount > 0) {
    confidence += 15;
  }
  
  // Balance extracted
  if (extracted.balanceAfter && extracted.balanceAfter > 0) {
    confidence += 10;
  }
  
  // Counterparty extracted
  if (extracted.counterpartyName) {
    confidence += 5;
  }
  
  // Text length reasonable
  if (text.length > 50 && text.length < 500) {
    confidence += 5;
  }
  
  return Math.min(100, confidence);
}

/**
 * Validate SMS content
 */
export function validateSmsContent(text: string): {
  valid: boolean;
  reason?: string;
} {
  if (!text || text.trim().length < 10) {
    return { valid: false, reason: 'Message trop court' };
  }
  
  if (text.length > 1000) {
    return { valid: false, reason: 'Message trop long' };
  }
  
  // Check for MoMo-related keywords
  const momoKeywords = [
    'solde', 'balance', 'fcfa', 'xof', 'reçu', 'received', 
    'envoyé', 'sent', 'transfert', 'orange', 'mtn', 'wave', 'moov',
    'retrait', 'dépôt', 'paiement', 'flooz', 'momo'
  ];
  
  const textLower = text.toLowerCase();
  const hasKeyword = momoKeywords.some(kw => textLower.includes(kw));
  
  if (!hasKeyword) {
    return { valid: false, reason: 'Ne semble pas être un SMS Mobile Money' };
  }
  
  return { valid: true };
}
