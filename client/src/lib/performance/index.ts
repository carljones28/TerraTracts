/**
 * TerraNova Vision - Performance and Diagnostics Utilities
 * Central export point for performance and diagnostic features
 */

// Import from other modules
import { 
  measureExecutionTime,
  debounce,
  throttle,
  memoize,
  lazyLoadImage,
  prefetchResources,
  PerformanceMonitor,
  performanceMonitor,
} from '../performanceUtils';

import {
  monitorApiCall,
  monitorAiOperation,
  monitorComponentRender,
  monitorUserInteraction,
  getResourceTimingMetrics,
  checkForPerformanceIssues,
  setupPerformanceMonitoring,
  PERF_THRESHOLDS,
} from '../perfMonitoring';

import {
  runAllDiagnostics,
  checkApiHealth,
  isOpenAIWorking,
  isAnthropicWorking,
  isMapBoxWorking,
} from '../diagnostics';

import {
  ErrorType,
  handleError,
  configureErrorHandling,
  resetErrorHandlingConfig,
  getRecentErrors,
  clearErrorLog,
  retry,
  processResponse,
  enhancedFetch,
  getUserFriendlyErrorMessage,
  withErrorHandling,
  setupGlobalErrorHandling,
} from '../errorHandling';

// Re-export all imports
export {
  // From performanceUtils
  measureExecutionTime,
  debounce,
  throttle,
  memoize,
  lazyLoadImage,
  prefetchResources,
  PerformanceMonitor,
  performanceMonitor,
  
  // From perfMonitoring
  monitorApiCall,
  monitorAiOperation,
  monitorComponentRender,
  monitorUserInteraction,
  getResourceTimingMetrics,
  checkForPerformanceIssues,
  setupPerformanceMonitoring,
  PERF_THRESHOLDS,
  
  // From diagnostics
  runAllDiagnostics,
  checkApiHealth,
  isOpenAIWorking,
  isAnthropicWorking,
  isMapBoxWorking,
  
  // From errorHandling
  ErrorType,
  handleError,
  configureErrorHandling,
  resetErrorHandlingConfig,
  getRecentErrors,
  clearErrorLog,
  retry,
  processResponse,
  enhancedFetch,
  getUserFriendlyErrorMessage,
  withErrorHandling,
  setupGlobalErrorHandling,
};

// Re-export ErrorDetails type
export type { ErrorDetails } from '../errorHandling';

/**
 * Initialize all performance monitoring and error handling
 * Central initialization point for the performance and diagnostics system
 */
export function initializePerformanceMonitoring(): () => void {
  // Set up global error handling
  setupGlobalErrorHandling();
  
  // Configure error handling
  configureErrorHandling({
    silent: false, 
    retryNetworkErrors: true,
    logToConsole: true,
    capturePerformance: true,
    maxRetries: 3
  });
  
  // Start performance monitoring (check every 30 seconds)
  const stopMonitoring = setupPerformanceMonitoring(30000);
  
  // Clear any existing performance data
  performance.clearResourceTimings();
  performance.clearMarks();
  performance.clearMeasures();
  
  console.info('Performance monitoring initialized');
  
  // Return function to clean up
  return () => {
    stopMonitoring();
    resetErrorHandlingConfig();
    clearErrorLog();
  };
}