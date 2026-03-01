/**
 * TerraTracts - API Health Diagnostics
 * Utility functions for monitoring and diagnosing API and service health
 */

interface ApiHealthResponse {
  status: 'healthy' | 'degraded' | 'unavailable';
  responseTime: number;
  details?: {
    error?: string;
    message?: string;
  };
}

/**
 * Checks the health of various application APIs
 * @returns A record of API endpoints and their health status
 */
export async function checkApiHealth(): Promise<Record<string, ApiHealthResponse>> {
  const startTime = performance.now();
  const timeout = 5000; // 5 second timeout
  
  const endpoints = [
    '/api/config',
    '/api/properties/featured',
    '/api/ai/property/1/risk-analysis',
    '/api/ai/property/1/valuation',
    '/api/ai/property/1/drone-footage'
  ];
  
  const results: Record<string, ApiHealthResponse> = {};
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  for (const endpoint of endpoints) {
    try {
      const fetchStartTime = performance.now();
      const response = await fetch(endpoint, { 
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      const fetchEndTime = performance.now();
      const responseTime = fetchEndTime - fetchStartTime;
      
      if (response.ok) {
        results[endpoint] = {
          status: responseTime > 2000 ? 'degraded' : 'healthy',
          responseTime,
          details: {
            message: `API endpoint responded in ${responseTime.toFixed(0)}ms`
          }
        };
      } else {
        results[endpoint] = {
          status: 'degraded',
          responseTime,
          details: {
            error: `API returned ${response.status} ${response.statusText}`
          }
        };
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      results[endpoint] = {
        status: 'unavailable',
        responseTime: performance.now() - startTime,
        details: {
          error: errorMessage
        }
      };
    }
  }
  
  clearTimeout(timeoutId);
  return results;
}

/**
 * Checks if OpenAI API integration is functioning
 * @returns True if OpenAI API is working
 */
export async function isOpenAIWorking(): Promise<boolean> {
  try {
    const response = await fetch('/api/ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'test query' }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return !!data && typeof data === 'object';
  } catch (error) {
    return false;
  }
}

/**
 * Checks if Anthropic API integration is functioning
 * @returns True if Anthropic API is working
 */
export async function isAnthropicWorking(): Promise<boolean> {
  try {
    const response = await fetch('/api/ai/enhanced-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'test query' }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return !!data && typeof data === 'object';
  } catch (error) {
    return false;
  }
}

/**
 * Checks if MapBox API integration is functioning
 * @returns True if MapBox API is working
 */
export async function isMapBoxWorking(): Promise<boolean> {
  // This is a client-side check that doesn't hit our server
  try {
    const response = await fetch('https://api.mapbox.com/styles/v1/mapbox/satellite-v9?access_token=' + 
      (window as any).MAPBOX_API_KEY, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Run all diagnostic checks
 * @returns An object with diagnostic results
 */
export async function runAllDiagnostics(): Promise<{
  apiHealth: Record<string, ApiHealthResponse>;
  openai: boolean;
  anthropic: boolean;
  mapbox: boolean;
}> {
  const [apiHealth, openai, anthropic, mapbox] = await Promise.all([
    checkApiHealth(),
    isOpenAIWorking(),
    isAnthropicWorking(),
    isMapBoxWorking()
  ]);
  
  return {
    apiHealth,
    openai,
    anthropic,
    mapbox
  };
}