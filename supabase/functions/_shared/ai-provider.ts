/**
 * WOUAKA AI Provider Abstraction Layer
 * =====================================
 * Hybrid AI architecture supporting:
 * - Lovable AI Gateway (production cloud)
 * - DeepSeek API (commercial cloud)
 * - Ollama (self-hosted VPS)
 * 
 * Environment Variables:
 * - AI_PROVIDER: 'lovable' | 'deepseek' | 'ollama' (default: 'lovable')
 * - DEEPSEEK_API_KEY: API key for DeepSeek
 * - DEEPSEEK_BASE_URL: DeepSeek API endpoint (default: https://api.deepseek.com)
 * - OLLAMA_BASE_URL: Ollama API endpoint (default: http://localhost:11434)
 * - OLLAMA_MODEL: Model name for Ollama (default: deepseek-r1:8b)
 * 
 * @version 2.0.0
 * @production https://www.wouaka-creditscore.com
 */

export type AIProvider = 'lovable' | 'deepseek' | 'ollama';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  tools?: AITool[];
  tool_choice?: { type: 'function'; function: { name: string } };
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface AICompletionResponse {
  success: boolean;
  provider: AIProvider;
  content?: string;
  tool_calls?: {
    function: {
      name: string;
      arguments: string;
    };
  }[];
  error?: string;
  latency_ms: number;
}

// Provider configurations
const PROVIDER_CONFIGS = {
  lovable: {
    baseUrl: 'https://ai.gateway.lovable.dev/v1',
    defaultModel: 'google/gemini-3-flash-preview',
    authHeader: (key: string) => `Bearer ${key}`,
    keyEnvVar: 'LOVABLE_API_KEY',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    authHeader: (key: string) => `Bearer ${key}`,
    keyEnvVar: 'DEEPSEEK_API_KEY',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/api',
    defaultModel: 'deepseek-r1:8b',
    authHeader: () => '', // No auth needed for local Ollama
    keyEnvVar: '',
  },
};

// Model mappings for different providers
const MODEL_MAPPINGS: Record<AIProvider, Record<string, string>> = {
  lovable: {
    'fraud-detection': 'google/gemini-3-flash-preview',
    'document-analysis': 'google/gemini-2.5-flash',
    'scoring': 'google/gemini-2.5-flash',
    'general': 'google/gemini-3-flash-preview',
  },
  deepseek: {
    'fraud-detection': 'deepseek-chat',
    'document-analysis': 'deepseek-chat',
    'scoring': 'deepseek-chat',
    'general': 'deepseek-chat',
  },
  ollama: {
    'fraud-detection': 'deepseek-r1:8b',
    'document-analysis': 'deepseek-r1:8b',
    'scoring': 'deepseek-r1:8b',
    'general': 'deepseek-r1:8b',
  },
};

/**
 * Get current AI provider from environment
 */
export function getAIProvider(): AIProvider {
  const provider = Deno.env.get('AI_PROVIDER')?.toLowerCase();
  if (provider === 'deepseek' || provider === 'ollama') {
    return provider;
  }
  return 'lovable'; // Default
}

/**
 * Get model for specific task and provider
 */
export function getModelForTask(task: string, provider?: AIProvider): string {
  const p = provider || getAIProvider();
  return MODEL_MAPPINGS[p][task] || MODEL_MAPPINGS[p]['general'];
}

/**
 * Get API configuration for provider
 */
function getProviderConfig(provider: AIProvider) {
  const config = PROVIDER_CONFIGS[provider];
  
  // Allow custom URLs via environment
  if (provider === 'deepseek') {
    const customUrl = Deno.env.get('DEEPSEEK_BASE_URL');
    if (customUrl) {
      return { ...config, baseUrl: customUrl };
    }
  }
  
  if (provider === 'ollama') {
    const customUrl = Deno.env.get('OLLAMA_BASE_URL');
    if (customUrl) {
      return { ...config, baseUrl: customUrl };
    }
    // Also check for custom model
    const customModel = Deno.env.get('OLLAMA_MODEL');
    if (customModel) {
      return { ...config, defaultModel: customModel };
    }
  }
  
  return config;
}

/**
 * Get API key for provider
 */
function getAPIKey(provider: AIProvider): string | null {
  if (provider === 'ollama') {
    return ''; // No key needed
  }
  
  const config = PROVIDER_CONFIGS[provider];
  return Deno.env.get(config.keyEnvVar) || null;
}

/**
 * Call Lovable AI Gateway
 */
async function callLovable(request: AICompletionRequest): Promise<Response> {
  const config = getProviderConfig('lovable');
  const apiKey = getAPIKey('lovable');
  
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }
  
  return fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': config.authHeader(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || config.defaultModel,
      messages: request.messages,
      tools: request.tools,
      tool_choice: request.tool_choice,
      stream: request.stream || false,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
    }),
  });
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(request: AICompletionRequest): Promise<Response> {
  const config = getProviderConfig('deepseek');
  const apiKey = getAPIKey('deepseek');
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }
  
  return fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': config.authHeader(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || config.defaultModel,
      messages: request.messages,
      tools: request.tools,
      tool_choice: request.tool_choice,
      stream: request.stream || false,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
    }),
  });
}

/**
 * Call Ollama API (local)
 * Note: Ollama has a different API format
 */
async function callOllama(request: AICompletionRequest): Promise<Response> {
  const config = getProviderConfig('ollama');
  
  // Convert messages to Ollama format (prompt-based)
  const systemPrompt = request.messages.find(m => m.role === 'system')?.content || '';
  const userMessages = request.messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
  
  const prompt = systemPrompt 
    ? `${systemPrompt}\n\n${userMessages}` 
    : userMessages;
  
  // If tools are provided, add instructions to return JSON
  let finalPrompt = prompt;
  if (request.tools && request.tools.length > 0) {
    const toolSchema = request.tools[0].function;
    finalPrompt = `${prompt}\n\nIMPORTANT: Retourne ta réponse au format JSON conforme à ce schéma:\n${JSON.stringify(toolSchema.parameters, null, 2)}`;
  }
  
  return fetch(`${config.baseUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || config.defaultModel,
      prompt: finalPrompt,
      stream: false,
      options: {
        temperature: request.temperature || 0.7,
        num_predict: request.max_tokens || 2048,
      },
    }),
  });
}

/**
 * Parse response based on provider
 */
async function parseResponse(
  response: Response, 
  provider: AIProvider,
  hasTools: boolean
): Promise<AICompletionResponse> {
  if (!response.ok) {
    const status = response.status;
    const errorText = await response.text();
    
    return {
      success: false,
      provider,
      error: `API error (${status}): ${errorText}`,
      latency_ms: 0,
    };
  }
  
  const data = await response.json();
  
  // Parse based on provider format
  if (provider === 'ollama') {
    // Ollama returns { response: string }
    const content = data.response || '';
    
    // Try to extract JSON if tools were expected
    let toolCalls;
    if (hasTools) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          toolCalls = [{
            function: {
              name: 'extracted_response',
              arguments: jsonMatch[0],
            },
          }];
        }
      } catch {
        // Continue without tool calls
      }
    }
    
    return {
      success: true,
      provider,
      content,
      tool_calls: toolCalls,
      latency_ms: data.total_duration ? data.total_duration / 1000000 : 0,
    };
  }
  
  // Lovable/DeepSeek use OpenAI-compatible format
  const choice = data.choices?.[0];
  if (!choice) {
    return {
      success: false,
      provider,
      error: 'No response choice returned',
      latency_ms: 0,
    };
  }
  
  return {
    success: true,
    provider,
    content: choice.message?.content,
    tool_calls: choice.message?.tool_calls,
    latency_ms: 0,
  };
}

/**
 * Main function to call AI with automatic provider selection
 */
export async function callAI(
  request: AICompletionRequest,
  options?: {
    provider?: AIProvider;
    fallback?: boolean; // If true, try fallback providers on failure
    task?: string; // Task type for model selection
  }
): Promise<AICompletionResponse> {
  const startTime = Date.now();
  const provider = options?.provider || getAIProvider();
  
  // Set model based on task if not specified
  if (!request.model && options?.task) {
    request.model = getModelForTask(options.task, provider);
  }
  
  console.log(`[AI Provider] Using ${provider} with model ${request.model || 'default'}`);
  
  try {
    let response: Response;
    
    switch (provider) {
      case 'deepseek':
        response = await callDeepSeek(request);
        break;
      case 'ollama':
        response = await callOllama(request);
        break;
      default:
        response = await callLovable(request);
    }
    
    const result = await parseResponse(response, provider, !!request.tools);
    result.latency_ms = Date.now() - startTime;
    
    // Log metrics
    console.log(`[AI Provider] ${provider} responded in ${result.latency_ms}ms, success: ${result.success}`);
    
    // Try fallback on failure if enabled
    if (!result.success && options?.fallback) {
      const fallbackProviders: AIProvider[] = ['lovable', 'deepseek', 'ollama'].filter(p => p !== provider) as AIProvider[];
      
      for (const fallback of fallbackProviders) {
        console.log(`[AI Provider] Trying fallback provider: ${fallback}`);
        
        try {
          const fallbackResult = await callAI(request, { 
            ...options, 
            provider: fallback, 
            fallback: false 
          });
          
          if (fallbackResult.success) {
            console.log(`[AI Provider] Fallback to ${fallback} succeeded`);
            return fallbackResult;
          }
        } catch (e) {
          console.error(`[AI Provider] Fallback ${fallback} failed:`, e);
        }
      }
    }
    
    return result;
    
  } catch (error) {
    console.error(`[AI Provider] ${provider} error:`, error);
    
    return {
      success: false,
      provider,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime,
    };
  }
}

/**
 * Convenience function for fraud detection
 */
export async function callFraudDetection(
  profileData: Record<string, unknown>,
  systemPrompt: string,
  userPrompt: string,
  tools?: AITool[]
): Promise<AICompletionResponse> {
  return callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tools,
    tool_choice: tools ? { type: 'function', function: { name: tools[0].function.name } } : undefined,
  }, {
    task: 'fraud-detection',
    fallback: true,
  });
}

/**
 * Convenience function for document analysis
 */
export async function callDocumentAnalysis(
  documentText: string,
  analysisType: string
): Promise<AICompletionResponse> {
  const systemPrompt = `Tu es un expert en analyse de documents d'identité pour l'Afrique de l'Ouest (zone UEMOA).
Analyse le texte OCR fourni et extrait les informations structurées.
Type d'analyse: ${analysisType}`;

  const userPrompt = `Extrait les informations de ce document:\n\n${documentText}`;
  
  return callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }, {
    task: 'document-analysis',
    fallback: true,
  });
}

/**
 * Get AI provider status for monitoring
 */
export function getAIProviderStatus(): {
  current: AIProvider;
  available: { provider: AIProvider; configured: boolean }[];
} {
  return {
    current: getAIProvider(),
    available: [
      { provider: 'lovable', configured: !!Deno.env.get('LOVABLE_API_KEY') },
      { provider: 'deepseek', configured: !!Deno.env.get('DEEPSEEK_API_KEY') },
      { provider: 'ollama', configured: true }, // Always available locally
    ],
  };
}
