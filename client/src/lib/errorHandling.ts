/**
 * TerraTracts - Error Handling Utilities
 * Centralized error handling for consistent error reporting and recovery
 */

import { performanceMonitor } from './performanceUtils';

// Define error types
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  MAPBOX = 'mapbox',
  UNKNOWN = 'unknown',
}

// Error details interface
export interface ErrorDetails {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  endpoint?: string;
  data?: any;
  timestamp: number;
}

// Error handling configuration
interface ErrorHandlingConfig {
  silent: boolean;
  retryNetworkErrors: boolean;
  logToConsole: boolean;
  capturePerformance: boolean;
  maxRetries: number;
}

// Default configuration
const defaultConfig: ErrorHandlingConfig = {
  silent: false,
  retryNetworkErrors: true,
  logToConsole: true,
  capturePerformance: true,
  maxRetries: 3,
};

// Global configuration
let config: ErrorHandlingConfig = { ...defaultConfig };

// Error log storage
const errorLog: ErrorDetails[] = [];
const MAX_ERROR_LOG_SIZE = 100;

/**
 * Configure error handling options
 * @param newConfig New configuration options
 */
export function configureErrorHandling(newConfig: Partial<ErrorHandlingConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Reset error handling configuration to defaults
 */
export function resetErrorHandlingConfig(): void {
  config = { ...defaultConfig };
}

/**
 * Determine error type based on error object
 * @param error The error object
 * @returns The error type
 */
function determineErrorType(error: any): ErrorType {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorType.NETWORK;
  }
  
  if (error instanceof DOMException && error.name === 'AbortError') {
    return ErrorType.TIMEOUT;
  }
  
  if (error.statusCode === 401 || error.statusCode === 403) {
    return ErrorType.PERMISSION;
  }
  
  if (error.statusCode === 422 || error.message?.includes('validation')) {
    return ErrorType.VALIDATION;
  }
  
  if (error.message?.includes('OpenAI') || error.endpoint?.includes('/openai/')) {
    return ErrorType.OPENAI;
  }
  
  if (error.message?.includes('Anthropic') || error.endpoint?.includes('/anthropic/')) {
    return ErrorType.ANTHROPIC;
  }
  
  if (error.message?.includes('Mapbox') || error.endpoint?.includes('mapbox')) {
    return ErrorType.MAPBOX;
  }
  
  if (error.statusCode || error.endpoint) {
    return ErrorType.API;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Handle an error
 * @param error The error object
 * @param endpoint Optional API endpoint where the error occurred
 * @param data Optional data that was being sent
 * @returns Standardized error details
 */
export function handleError(error: any, endpoint?: string, data?: any): ErrorDetails {
  // Extract status code if available
  const statusCode = error.status || error.statusCode || 
                    (error.response ? error.response.status : undefined);
  
  // Create standardized error details
  const errorDetails: ErrorDetails = {
    type: determineErrorType(error),
    message: error.message || 'An unknown error occurred',
    originalError: error instanceof Error ? error : new Error(String(error)),
    statusCode,
    endpoint,
    data,
    timestamp: Date.now(),
  };

  // Log to console if enabled
  if (config.logToConsole) {
    console.error(`[${errorDetails.type}] ${errorDetails.message}`, errorDetails);
  }
  
  // Capture performance metrics if enabled
  if (config.capturePerformance) {
    performanceMonitor.recordMeasurement(`error.${errorDetails.type}`, 0);
  }
  
  // Add to error log
  errorLog.push(errorDetails);
  
  // Trim error log if it exceeds maximum size
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift();
  }
  
  return errorDetails;
}

/**
 * Get recent errors
 * @param count Number of recent errors to retrieve
 * @param type Optional filter by error type
 * @returns Array of error details
 */
export function getRecentErrors(count: number = 10, type?: ErrorType): ErrorDetails[] {
  if (type) {
    return errorLog
      .filter(error => error.type === type)
      .slice(-count);
  }
  
  return errorLog.slice(-count);
}

/**
 * Clear the error log
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

/**
 * Retry a function that may fail with exponential backoff
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 * @returns Promise resolving to the function's result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = config.maxRetries,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted all retries, handle the error
  throw handleError(lastError);
}

/**
 * Process response from fetch API with error handling
 * @param response Fetch API response
 * @param endpoint API endpoint
 * @returns Promise resolving to parsed response data
 */
export async function processResponse(response: Response, endpoint: string): Promise<any> {
  if (!response.ok) {
    let errorData: any = { status: response.status, statusText: response.statusText };
    
    try {
      // Try to parse the error response as JSON
      errorData = await response.json();
    } catch {
      // If parsing fails, use text
      try {
        errorData.message = await response.text();
      } catch {
        errorData.message = response.statusText;
      }
    }
    
    // Add status and statusText if they don't exist in the parsed data
    if (!errorData.status) {
      errorData.status = response.status;
    }
    if (!errorData.statusText && !errorData.message) {
      errorData.statusText = response.statusText;
    }
    
    // Create an error with details
    const error = new Error(errorData.message || errorData.statusText || 'API request failed');
    (error as any).statusCode = response.status;
    (error as any).details = errorData;
    
    // Handle the error
    throw handleError(error, endpoint);
  }
  
  try {
    // Try to parse as JSON
    return await response.json();
  } catch (error) {
    // If JSON parsing fails, return text
    return await response.text();
  }
}

/**
 * Enhanced fetch with error handling and retry
 * @param url URL to fetch
 * @param options Fetch options
 * @returns Promise resolving to parsed response data
 */
export async function enhancedFetch(url: string, options: RequestInit = {}): Promise<any> {
  const retryFetch = config.retryNetworkErrors;
  
  if (retryFetch) {
    return retry(async () => {
      const response = await fetch(url, options);
      return processResponse(response, url);
    });
  } else {
    const response = await fetch(url, options);
    return processResponse(response, url);
  }
}

/**
 * Get a user-friendly error message
 * @param error Error object or error details
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error | ErrorDetails): string {
  // If error is an Error object, convert it to ErrorDetails
  if (error instanceof Error && !(error as any).type) {
    error = handleError(error);
  }
  
  const details = error as ErrorDetails;
  
  switch (details.type) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    
    case ErrorType.TIMEOUT:
      return 'The request took too long to complete. Please try again later.';
    
    case ErrorType.PERMISSION:
      return 'You don\'t have permission to access this resource.';
    
    case ErrorType.VALIDATION:
      return 'The information provided is not valid. Please check your inputs and try again.';
    
    case ErrorType.OPENAI:
      return 'Unable to connect to AI services. This feature may be temporarily unavailable.';
    
    case ErrorType.ANTHROPIC:
      return 'Unable to connect to Claude AI services. This feature may be temporarily unavailable.';
    
    case ErrorType.MAPBOX:
      return 'Map services are currently unavailable. Please try again later.';
    
    case ErrorType.API:
      if (details.statusCode && details.statusCode === 404) {
        return 'The requested resource was not found.';
      }
      if (details.statusCode && details.statusCode === 429) {
        return 'Too many requests. Please wait a moment and try again.';
      }
      if (details.statusCode && details.statusCode >= 500) {
        return 'The server encountered an issue. Our team has been notified.';
      }
      return 'There was a problem with your request. Please try again.';
    
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Wrapper function to execute a callback with error handling
 * @param callback Function to execute
 * @param fallback Optional fallback function to handle errors
 * @returns Promise resolving to the result of the callback or fallback
 */
export async function withErrorHandling<T>(
  callback: () => Promise<T>,
  fallback?: (error: ErrorDetails) => Promise<T> | T
): Promise<T> {
  try {
    return await callback();
  } catch (error: unknown) {
    // Type guard to check if error is already ErrorDetails type
    const isErrorDetails = (err: unknown): err is ErrorDetails => {
      return typeof err === 'object' && err !== null && 'type' in err;
    };
    
    const errorDetails = isErrorDetails(error) ? error : handleError(error);
    
    if (fallback) {
      return await fallback(errorDetails);
    }
    
    throw errorDetails;
  }
}

/**
 * Set up global error handlers
 */
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    handleError(event.reason || new Error('Unhandled promise rejection'), 'global');
    
    // Prevent the default browser behavior
    event.preventDefault();
  });
  
  // Handle uncaught exceptions
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error || event.message);
    handleError(event.error || new Error(event.message || 'Unknown error'), 'global');
    
    // Prevent the default browser behavior
    event.preventDefault();
  });
  
  // Override the console.error method to capture errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Call the original console.error
    originalConsoleError.apply(console, args);
    
    // Only handle errors, not general logs
    const firstArg = args[0];
    if (firstArg instanceof Error) {
      handleError(firstArg, 'console');
    }
  };
  
  console.info('Global error handling set up successfully');
}