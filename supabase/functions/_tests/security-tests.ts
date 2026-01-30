/**
 * WOUAKA Security Tests
 * =====================
 * Tests automatisés pour valider:
 * - Protection SSRF sur les endpoints webhooks
 * - Rate limiting sur les endpoints partners-*
 * 
 * Usage: Exécuter via la page admin ou l'API test
 */

// ============================================
// TYPES
// ============================================

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  details?: string
}

interface TestSuite {
  name: string
  tests: TestResult[]
  passed: number
  failed: number
  duration: number
}

// ============================================
// SSRF PROTECTION TESTS
// ============================================

const SSRF_TEST_CASES = {
  // URLs qui DOIVENT être bloquées
  blocked: [
    { url: 'http://example.com/hook', reason: 'HTTP non-HTTPS' },
    { url: 'https://localhost/hook', reason: 'localhost' },
    { url: 'https://127.0.0.1/hook', reason: 'loopback IPv4' },
    { url: 'https://0.0.0.0/hook', reason: 'adresse zéro' },
    { url: 'https://[::1]/hook', reason: 'loopback IPv6' },
    { url: 'https://10.0.0.1/hook', reason: 'IP privée classe A' },
    { url: 'https://172.16.0.1/hook', reason: 'IP privée classe B' },
    { url: 'https://172.31.255.255/hook', reason: 'IP privée classe B max' },
    { url: 'https://192.168.1.1/hook', reason: 'IP privée classe C' },
    { url: 'https://169.254.169.254/hook', reason: 'AWS metadata' },
    { url: 'https://169.254.170.2/hook', reason: 'AWS ECS metadata' },
    { url: 'https://metadata.google.internal/hook', reason: 'GCP metadata' },
    { url: 'https://example.com/latest/meta-data/iam', reason: 'AWS metadata path' },
    { url: 'https://example.com/computeMetadata/v1/', reason: 'GCP metadata path' },
    { url: 'https://host.docker.internal/hook', reason: 'Docker host' },
    { url: 'https://kubernetes.default.svc/hook', reason: 'Kubernetes service' },
    { url: 'https://my-service.local/hook', reason: 'domaine .local' },
    { url: 'https://api.internal/hook', reason: 'domaine .internal' },
    { url: 'https://test.localhost/hook', reason: 'sous-domaine localhost' },
    { url: 'https://100.64.0.1/hook', reason: 'Carrier-grade NAT' },
    { url: 'https://192.0.2.1/hook', reason: 'TEST-NET-1' },
    { url: 'https://198.51.100.1/hook', reason: 'TEST-NET-2' },
    { url: 'https://203.0.113.1/hook', reason: 'TEST-NET-3' },
    { url: 'https://224.0.0.1/hook', reason: 'Multicast' },
    { url: 'https://255.255.255.255/hook', reason: 'Broadcast' },
    { url: 'not-a-url', reason: 'URL invalide' },
    { url: '', reason: 'URL vide' },
  ],
  
  // URLs qui DOIVENT être acceptées
  allowed: [
    { url: 'https://api.example.com/webhooks', reason: 'URL publique valide' },
    { url: 'https://hooks.slack.com/services/xxx', reason: 'Slack webhook' },
    { url: 'https://discord.com/api/webhooks/xxx', reason: 'Discord webhook' },
    { url: 'https://webhook.site/test', reason: 'webhook.site test' },
    { url: 'https://my-company.com/api/v1/hooks', reason: 'entreprise custom' },
    { url: 'https://8.8.8.8/hook', reason: 'IP publique Google DNS' },
    { url: 'https://1.1.1.1/hook', reason: 'IP publique Cloudflare' },
  ]
}

export function testSsrfValidation(): TestSuite {
  const results: TestResult[] = []
  const startTime = Date.now()
  
  // Test blocked URLs
  for (const testCase of SSRF_TEST_CASES.blocked) {
    const start = Date.now()
    try {
      const result = validateWebhookUrlTest(testCase.url)
      const passed = !result.valid
      
      results.push({
        name: `SSRF Block: ${testCase.reason}`,
        passed,
        duration: Date.now() - start,
        details: passed 
          ? `URL correctement bloquée: ${testCase.url.substring(0, 50)}...`
          : `ÉCHEC: URL devrait être bloquée mais est acceptée`,
        error: passed ? undefined : `URL non bloquée: ${testCase.url}`
      })
    } catch (e) {
      results.push({
        name: `SSRF Block: ${testCase.reason}`,
        passed: true, // Exception = bloqué
        duration: Date.now() - start,
        details: `URL bloquée par exception`
      })
    }
  }
  
  // Test allowed URLs
  for (const testCase of SSRF_TEST_CASES.allowed) {
    const start = Date.now()
    try {
      const result = validateWebhookUrlTest(testCase.url)
      const passed = result.valid
      
      results.push({
        name: `SSRF Allow: ${testCase.reason}`,
        passed,
        duration: Date.now() - start,
        details: passed 
          ? `URL correctement acceptée`
          : `ÉCHEC: URL légitime bloquée - ${result.error}`,
        error: passed ? undefined : result.error
      })
    } catch (e: any) {
      results.push({
        name: `SSRF Allow: ${testCase.reason}`,
        passed: false,
        duration: Date.now() - start,
        error: `Exception inattendue: ${e.message}`
      })
    }
  }
  
  return {
    name: 'SSRF Protection Tests',
    tests: results,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    duration: Date.now() - startTime
  }
}

// ============================================
// RATE LIMITING TESTS
// ============================================

export interface RateLimitTestConfig {
  endpoint: string
  apiKey: string
  limit: number
  windowMinutes?: number
}

export async function testRateLimiting(
  config: RateLimitTestConfig,
  makeRequest: (endpoint: string, apiKey: string) => Promise<{ status: number; headers: Headers }>
): Promise<TestSuite> {
  const results: TestResult[] = []
  const startTime = Date.now()
  
  // Test 1: Vérifier les headers de rate limit
  const test1Start = Date.now()
  try {
    const response = await makeRequest(config.endpoint, config.apiKey)
    const limitHeader = response.headers.get('X-RateLimit-Limit')
    const remainingHeader = response.headers.get('X-RateLimit-Remaining')
    const resetHeader = response.headers.get('X-RateLimit-Reset')
    
    const hasAllHeaders = !!(limitHeader && remainingHeader && resetHeader)
    
    results.push({
      name: 'Rate Limit Headers Present',
      passed: hasAllHeaders,
      duration: Date.now() - test1Start,
      details: hasAllHeaders 
        ? `Limit: ${limitHeader}, Remaining: ${remainingHeader}`
        : `Headers manquants: ${!limitHeader ? 'Limit ' : ''}${!remainingHeader ? 'Remaining ' : ''}${!resetHeader ? 'Reset' : ''}`,
      error: hasAllHeaders ? undefined : 'Headers de rate limit absents'
    })
  } catch (e: any) {
    results.push({
      name: 'Rate Limit Headers Present',
      passed: false,
      duration: Date.now() - test1Start,
      error: e.message
    })
  }
  
  // Test 2: Vérifier que le remaining décrémente
  const test2Start = Date.now()
  try {
    const response1 = await makeRequest(config.endpoint, config.apiKey)
    const remaining1 = parseInt(response1.headers.get('X-RateLimit-Remaining') || '0')
    
    const response2 = await makeRequest(config.endpoint, config.apiKey)
    const remaining2 = parseInt(response2.headers.get('X-RateLimit-Remaining') || '0')
    
    const decremented = remaining2 < remaining1 || remaining2 === 0
    
    results.push({
      name: 'Rate Limit Remaining Decrements',
      passed: decremented,
      duration: Date.now() - test2Start,
      details: `Before: ${remaining1}, After: ${remaining2}`,
      error: decremented ? undefined : 'Remaining ne décrémente pas'
    })
  } catch (e: any) {
    results.push({
      name: 'Rate Limit Remaining Decrements',
      passed: false,
      duration: Date.now() - test2Start,
      error: e.message
    })
  }
  
  // Test 3: Vérifier le format de X-RateLimit-Reset (ISO 8601)
  const test3Start = Date.now()
  try {
    const response = await makeRequest(config.endpoint, config.apiKey)
    const resetHeader = response.headers.get('X-RateLimit-Reset')
    
    let validFormat = false
    if (resetHeader) {
      const resetDate = new Date(resetHeader)
      validFormat = !isNaN(resetDate.getTime()) && resetDate > new Date()
    }
    
    results.push({
      name: 'Rate Limit Reset Format Valid',
      passed: validFormat,
      duration: Date.now() - test3Start,
      details: `Reset: ${resetHeader}`,
      error: validFormat ? undefined : 'Format de date Reset invalide ou passé'
    })
  } catch (e: any) {
    results.push({
      name: 'Rate Limit Reset Format Valid',
      passed: false,
      duration: Date.now() - test3Start,
      error: e.message
    })
  }
  
  // Test 4: Vérifier que la limite correspond à api_keys.rate_limit
  const test4Start = Date.now()
  try {
    const response = await makeRequest(config.endpoint, config.apiKey)
    const limitHeader = parseInt(response.headers.get('X-RateLimit-Limit') || '0')
    
    const matchesConfig = limitHeader === config.limit
    
    results.push({
      name: 'Rate Limit Matches API Key Config',
      passed: matchesConfig,
      duration: Date.now() - test4Start,
      details: `Expected: ${config.limit}, Got: ${limitHeader}`,
      error: matchesConfig ? undefined : `Limite ne correspond pas: attendu ${config.limit}, reçu ${limitHeader}`
    })
  } catch (e: any) {
    results.push({
      name: 'Rate Limit Matches API Key Config',
      passed: false,
      duration: Date.now() - test4Start,
      error: e.message
    })
  }
  
  return {
    name: `Rate Limiting Tests - ${config.endpoint}`,
    tests: results,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    duration: Date.now() - startTime
  }
}

// ============================================
// SSRF VALIDATION FUNCTION (Copy for testing)
// ============================================

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
  '169.254.170.2',
  'metadata.google.internal',
  'metadata.goog',
  'kubernetes.default',
  'kubernetes.default.svc',
  'host.docker.internal',
  'gateway.docker.internal',
]

const BLOCKED_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./,
  /^192\.0\.0\./,
  /^192\.0\.2\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^224\./,
  /^240\./,
  /^255\./,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
]

function validateWebhookUrlTest(urlString: string): { valid: boolean; error?: string } {
  if (!urlString || urlString.trim() === '') {
    return { valid: false, error: 'URL is required' }
  }
  
  try {
    const url = new URL(urlString)
    
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed' }
    }
    
    const hostname = url.hostname.toLowerCase()
    if (BLOCKED_HOSTS.includes(hostname)) {
      return { valid: false, error: 'Blocked host: access to internal services is not allowed' }
    }
    
    if (url.pathname.includes('/latest/meta-data') || 
        url.pathname.includes('/metadata/') ||
        url.pathname.includes('/computeMetadata/')) {
      return { valid: false, error: 'Access to cloud metadata endpoints is not allowed' }
    }
    
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Private/internal IP addresses are not allowed' }
      }
    }
    
    if (hostname.endsWith('.local') || 
        hostname.endsWith('.internal') || 
        hostname.endsWith('.localhost')) {
      return { valid: false, error: 'Local/internal domain names are not allowed' }
    }
    
    if (/^(127|0|10|172\.(1[6-9]|2\d|3[01])|192\.168)\./.test(hostname)) {
      return { valid: false, error: 'Private IP addresses are not allowed' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// ============================================
// COMPREHENSIVE TEST RUNNER
// ============================================

export interface AllTestsResult {
  timestamp: string
  suites: TestSuite[]
  totalPassed: number
  totalFailed: number
  totalDuration: number
  allPassed: boolean
}

export function runSsrfTestsSync(): AllTestsResult {
  const startTime = Date.now()
  const suites: TestSuite[] = []
  
  // Run SSRF tests (synchronous)
  suites.push(testSsrfValidation())
  
  const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0)
  const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0)
  
  return {
    timestamp: new Date().toISOString(),
    suites,
    totalPassed,
    totalFailed,
    totalDuration: Date.now() - startTime,
    allPassed: totalFailed === 0
  }
}

export async function runAllSecurityTests(
  makeRequest: (endpoint: string, apiKey: string) => Promise<{ status: number; headers: Headers }>,
  rateLimitConfigs: RateLimitTestConfig[]
): Promise<AllTestsResult> {
  const startTime = Date.now()
  const suites: TestSuite[] = []
  
  // Run SSRF tests (synchronous)
  suites.push(testSsrfValidation())
  
  // Run rate limit tests for each endpoint (async)
  for (const config of rateLimitConfigs) {
    const suite = await testRateLimiting(config, makeRequest)
    suites.push(suite)
  }
  
  const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0)
  const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0)
  
  return {
    timestamp: new Date().toISOString(),
    suites,
    totalPassed,
    totalFailed,
    totalDuration: Date.now() - startTime,
    allPassed: totalFailed === 0
  }
}

// Export test cases for external use
export { SSRF_TEST_CASES }
