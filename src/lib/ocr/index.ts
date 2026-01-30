/**
 * WOUAKA OCR Module
 * Deep extraction for Mobile Money screenshots and SMS parsing
 */

// MoMo Screenshot Deep Extractor
export {
  analyzeMoMoScreenshot,
  batchAnalyzeScreenshots,
  aggregateScreenshotData,
  type MoMoProvider,
  type ExtractedTransaction,
  type MoMoScreenshotAnalysis,
  type ELAAnomaly
} from './momo-deep-extractor';

// SMS Parser
export {
  parseSms,
  parseSmsMessages,
  aggregateSmsData,
  validateSmsContent,
  type SmsProvider,
  type TransactionType,
  type ParsedSms
} from './sms-parser';

// Re-export base OCR service
export {
  extractTextFromImage,
  extractTextFromImages,
  validateImageForOCR,
  type OCRResult,
  type OCRProgress
} from '../ocr-service';
