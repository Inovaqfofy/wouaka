import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

interface AllTestsResult {
  timestamp: string
  suites: TestSuite[]
  totalPassed: number
  totalFailed: number
  totalDuration: number
  allPassed: boolean
}

// ============================================
// SSRF TEST CASES
// ============================================

const SSRF_BLOCKED_URLS = [
  { url: 'http://example.com/hook', reason: 'HTTP non-HTTPS' },
  { url: 'https://localhost/hook', reason: 'localhost' },
  { url: 'https://127.0.0.1/hook', reason: 'loopback IPv4' },
  { url: 'https://0.0.0.0/hook', reason: 'adresse zéro' },
  { url: 'https://10.0.0.1/hook', reason: 'IP privée classe A' },
  { url: 'https://172.16.0.1/hook', reason: 'IP privée classe B' },
  { url: 'https://192.168.1.1/hook', reason: 'IP privée classe C' },
  { url: 'https://169.254.169.254/hook', reason: 'AWS metadata' },
  { url: 'https://metadata.google.internal/hook', reason: 'GCP metadata' },
  { url: 'https://example.com/latest/meta-data/iam', reason: 'AWS metadata path' },
  { url: 'https://host.docker.internal/hook', reason: 'Docker host' },
  { url: 'https://kubernetes.default.svc/hook', reason: 'Kubernetes' },
  { url: 'https://my-service.local/hook', reason: 'domaine .local' },
  { url: 'https://api.internal/hook', reason: 'domaine .internal' },
  { url: 'https://100.64.0.1/hook', reason: 'Carrier-grade NAT' },
  { url: 'https://224.0.0.1/hook', reason: 'Multicast' },
  { url: 'not-a-url', reason: 'URL invalide' },
]

const SSRF_ALLOWED_URLS = [
  { url: 'https://api.example.com/webhooks', reason: 'URL publique' },
  { url: 'https://hooks.slack.com/services/xxx', reason: 'Slack webhook' },
  { url: 'https://discord.com/api/webhooks/xxx', reason: 'Discord webhook' },
  { url: 'https://8.8.8.8/hook', reason: 'IP publique' },
]

// ============================================
// SSRF VALIDATION (Mirror of production code)
// ============================================

const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '169.254.169.254', '169.254.170.2',
  'metadata.google.internal', 'metadata.goog',
  'kubernetes.default', 'kubernetes.default.svc',
  'host.docker.internal', 'gateway.docker.internal',
]

const BLOCKED_IP_PATTERNS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./, /^169\.254\./, /^0\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./,
  /^192\.0\.0\./, /^192\.0\.2\./, /^198\.51\.100\./, /^203\.0\.113\./,
  /^224\./, /^240\./, /^255\./,
  /^fc[0-9a-f]{2}:/i, /^fd[0-9a-f]{2}:/i, /^fe80:/i,
]

function validateWebhookUrl(urlString: string): { valid: boolean; error?: string } {
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
      return { valid: false, error: 'Blocked host' }
    }
    
    if (url.pathname.includes('/latest/meta-data') || 
        url.pathname.includes('/metadata/') ||
        url.pathname.includes('/computeMetadata/')) {
      return { valid: false, error: 'Cloud metadata endpoint blocked' }
    }
    
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Private IP blocked' }
      }
    }
    
    if (hostname.endsWith('.local') || 
        hostname.endsWith('.internal') || 
        hostname.endsWith('.localhost')) {
      return { valid: false, error: 'Internal domain blocked' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// ============================================
// TEST RUNNERS
// ============================================

function runSsrfTests(): TestSuite {
  const results: TestResult[] = []
  const startTime = Date.now()
  
  // Test blocked URLs
  for (const testCase of SSRF_BLOCKED_URLS) {
    const start = Date.now()
    const result = validateWebhookUrl(testCase.url)
    const passed = !result.valid
    
    results.push({
      name: `Block: ${testCase.reason}`,
      passed,
      duration: Date.now() - start,
      details: testCase.url.substring(0, 60),
      error: passed ? undefined : 'URL should be blocked'
    })
  }
  
  // Test allowed URLs
  for (const testCase of SSRF_ALLOWED_URLS) {
    const start = Date.now()
    const result = validateWebhookUrl(testCase.url)
    const passed = result.valid
    
    results.push({
      name: `Allow: ${testCase.reason}`,
      passed,
      duration: Date.now() - start,
      details: testCase.url.substring(0, 60),
      error: passed ? undefined : result.error
    })
  }
  
  return {
    name: 'SSRF Protection',
    tests: results,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    duration: Date.now() - startTime
  }
}

async function runRateLimitTests(
  supabase: any,
  baseUrl: string,
  apiKey: string
): Promise<TestSuite> {
  const results: TestResult[] = []
  const startTime = Date.now()
  const endpoints = [
    '/partners-score',
    '/partners-kyc', 
    '/partners-identity',
    '/partners-webhooks'
  ]
  
  for (const endpoint of endpoints) {
    const testStart = Date.now()
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ test: true })
      })
      
      const limitHeader = response.headers.get('X-RateLimit-Limit')
      const remainingHeader = response.headers.get('X-RateLimit-Remaining')
      const resetHeader = response.headers.get('X-RateLimit-Reset')
      
      const hasHeaders = limitHeader && remainingHeader && resetHeader
      
      results.push({
        name: `Rate Headers: ${endpoint}`,
        passed: !!hasHeaders,
        duration: Date.now() - testStart,
        details: hasHeaders 
          ? `Limit: ${limitHeader}, Remaining: ${remainingHeader}`
          : 'Missing rate limit headers',
        error: hasHeaders ? undefined : 'Rate limit headers not present'
      })
      
      // Test reset format
      if (resetHeader) {
        const resetDate = new Date(resetHeader)
        const validFormat = !isNaN(resetDate.getTime())
        
        results.push({
          name: `Reset Format: ${endpoint}`,
          passed: validFormat,
          duration: 1,
          details: resetHeader,
          error: validFormat ? undefined : 'Invalid ISO 8601 format'
        })
      }
    } catch (e: any) {
      results.push({
        name: `Rate Limit: ${endpoint}`,
        passed: false,
        duration: Date.now() - testStart,
        error: e.message
      })
    }
  }
  
  return {
    name: 'Rate Limiting',
    tests: results,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    duration: Date.now() - startTime
  }
}

async function runWebhookSsrfIntegrationTests(
  baseUrl: string,
  apiKey: string
): Promise<TestSuite> {
  const results: TestResult[] = []
  const startTime = Date.now()
  
  const blockedUrls = [
    'https://169.254.169.254/hook',
    'https://localhost/hook',
    'https://10.0.0.1/hook',
    'http://example.com/hook'
  ]
  
  for (const webhookUrl of blockedUrls) {
    const testStart = Date.now()
    
    try {
      const response = await fetch(`${baseUrl}/partners-webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          name: 'Test SSRF',
          url: webhookUrl,
          events: ['score.calculated']
        })
      })
      
      const data = await response.json()
      const blocked = response.status === 400 && data.code === 'SSRF_BLOCKED'
      
      results.push({
        name: `Integration Block: ${webhookUrl.substring(0, 40)}`,
        passed: blocked,
        duration: Date.now() - testStart,
        details: blocked ? 'Correctly blocked' : `Status: ${response.status}`,
        error: blocked ? undefined : 'URL should be blocked by API'
      })
    } catch (e: any) {
      results.push({
        name: `Integration Block: ${webhookUrl.substring(0, 40)}`,
        passed: false,
        duration: Date.now() - testStart,
        error: e.message
      })
    }
  }
  
  return {
    name: 'Webhook SSRF Integration',
    tests: results,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    duration: Date.now() - startTime
  }
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Verify admin access via JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Check admin role from user_roles table
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (userRole?.role !== 'SUPER_ADMIN') {
    return new Response(
      JSON.stringify({ error: 'Admin access required', debug: { userId: user.id, role: userRole?.role } }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const url = new URL(req.url)
  const testType = url.searchParams.get('type') || 'all'
  const apiKeyForTest = url.searchParams.get('api_key') // Optional: for rate limit tests
  
  const startTime = Date.now()
  const suites: TestSuite[] = []
  
  try {
    // Always run SSRF unit tests
    if (testType === 'all' || testType === 'ssrf') {
      suites.push(runSsrfTests())
    }
    
    // Run rate limit tests if API key provided
    if ((testType === 'all' || testType === 'rate-limit') && apiKeyForTest) {
      const rateLimitSuite = await runRateLimitTests(
        supabase,
        supabaseUrl.replace('/rest/v1', '/functions/v1'),
        apiKeyForTest
      )
      suites.push(rateLimitSuite)
    }
    
    // Run SSRF integration tests if API key provided
    if ((testType === 'all' || testType === 'ssrf-integration') && apiKeyForTest) {
      const integrationSuite = await runWebhookSsrfIntegrationTests(
        supabaseUrl.replace('/rest/v1', '/functions/v1'),
        apiKeyForTest
      )
      suites.push(integrationSuite)
    }
    
    const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0)
    const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0)
    
    const result: AllTestsResult = {
      timestamp: new Date().toISOString(),
      suites,
      totalPassed,
      totalFailed,
      totalDuration: Date.now() - startTime,
      allPassed: totalFailed === 0
    }
    
    // Log test execution
    await supabase.from('audit_logs').insert({
      action: 'security_tests_executed',
      entity_type: 'security',
      entity_id: 'tests',
      user_id: user.id,
      metadata: {
        test_type: testType,
        total_passed: totalPassed,
        total_failed: totalFailed,
        duration_ms: result.totalDuration
      }
    })
    
    console.log(`[SECURITY TESTS] Completed: ${totalPassed} passed, ${totalFailed} failed`)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: totalFailed === 0 ? 200 : 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (e: any) {
    console.error('[SECURITY TESTS] Error:', e)
    
    return new Response(
      JSON.stringify({ error: 'Test execution failed', details: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
