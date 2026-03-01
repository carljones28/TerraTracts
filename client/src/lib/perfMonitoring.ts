/**
 * TerraNova Vision - Performance Monitoring Utilities
 */

import { performanceMonitor } from './performanceUtils';
import { handleError, ErrorType } from './errorHandling';

// Performance thresholds in milliseconds
export const PERF_THRESHOLDS = {
  API_REQUEST: 3000,      // 3 seconds for API requests
  MAP_RENDERING: 1000,    // 1 second for map rendering
  AI_PROCESSING: 10000,   // 10 seconds for AI processing
  COMPONENT_RENDER: 100,  // 100ms for component rendering
  INTERACTION: 50,        // 50ms for user interactions
};

// Resource timing metrics interface
interface ResourceTimingMetrics {
  name: string;
  duration: number;
  initiatorType: string;
  transferSize: number;
  decodedBodySize: number;
  redirectTime: number;
  dnsTime: number;
  connectTime: number;
  ttfb: number;
  downloadTime: number;
  isSlowResource: boolean;
}

/**
 * Monitor API calls and their performance
 * @param name The API endpoint or name
 * @returns A function to end monitoring and record the result
 */
export function monitorApiCall(name: string): () => number {
  return performanceMonitor.startMeasure(`api.${name}`);
}

/**
 * Monitor AI operations and their performance
 * @param operation The AI operation name
 * @returns A function to end monitoring and record the result
 */
export function monitorAiOperation(operation: string): () => number {
  return performanceMonitor.startMeasure(`ai.${operation}`);
}

/**
 * Monitor component rendering performance
 * @param componentName The component name
 * @returns A function to end monitoring and record the result
 */
export function monitorComponentRender(componentName: string): () => number {
  return performanceMonitor.startMeasure(`component.${componentName}`);
}

/**
 * Monitor user interaction performance
 * @param interactionType The type of interaction
 * @returns A function to end monitoring and record the result
 */
export function monitorUserInteraction(interactionType: string): () => number {
  return performanceMonitor.startMeasure(`interaction.${interactionType}`);
}

/**
 * Parse resource timing entries and extract useful metrics
 * @returns Array of resource timing metrics
 */
export function getResourceTimingMetrics(): ResourceTimingMetrics[] {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map(resource => {
    const redirectTime = resource.redirectEnd - resource.redirectStart;
    const dnsTime = resource.domainLookupEnd - resource.domainLookupStart;
    const connectTime = resource.connectEnd - resource.connectStart;
    const ttfb = resource.responseStart - resource.requestStart;
    const downloadTime = resource.responseEnd - resource.responseStart;
    const duration = resource.duration;
    
    // Determine if this is a slow resource based on thresholds
    let isSlowResource = false;
    if (
      (resource.initiatorType === 'xmlhttprequest' && duration > PERF_THRESHOLDS.API_REQUEST) ||
      (resource.initiatorType === 'script' && duration > 1000) ||
      (resource.initiatorType === 'img' && duration > 2000) ||
      (ttfb > 1000) // Slow server response
    ) {
      isSlowResource = true;
    }
    
    return {
      name: resource.name,
      duration,
      initiatorType: resource.initiatorType,
      transferSize: resource.transferSize,
      decodedBodySize: resource.decodedBodySize,
      redirectTime,
      dnsTime,
      connectTime,
      ttfb,
      downloadTime,
      isSlowResource,
    };
  });
}

/**
 * Check for performance issues and report them
 */
export function checkForPerformanceIssues(): void {
  // Get all metrics
  const allMetrics = performanceMonitor.getAllMetrics();
  const slowMetrics = [];
  
  // Check for slow API calls
  for (const [name, duration] of Object.entries(allMetrics)) {
    if (name.startsWith('api.') && duration > PERF_THRESHOLDS.API_REQUEST) {
      slowMetrics.push({ name, duration, threshold: PERF_THRESHOLDS.API_REQUEST });
    } else if (name.startsWith('ai.') && duration > PERF_THRESHOLDS.AI_PROCESSING) {
      slowMetrics.push({ name, duration, threshold: PERF_THRESHOLDS.AI_PROCESSING });
    } else if (name.startsWith('component.') && duration > PERF_THRESHOLDS.COMPONENT_RENDER) {
      slowMetrics.push({ name, duration, threshold: PERF_THRESHOLDS.COMPONENT_RENDER });
    } else if (name.startsWith('interaction.') && duration > PERF_THRESHOLDS.INTERACTION) {
      slowMetrics.push({ name, duration, threshold: PERF_THRESHOLDS.INTERACTION });
    }
  }
  
  // Check for slow resources
  const slowResources = getResourceTimingMetrics()
    .filter(resource => resource.isSlowResource);
  
  // Report slow metrics if there are any
  if (slowMetrics.length > 0 || slowResources.length > 0) {
    console.warn('Performance issues detected:', { 
      slowMetrics, 
      slowResources: slowResources.slice(0, 10) // Limit to 10 slow resources
    });
    
    // Log an error for significant performance issues
    if (slowMetrics.some(m => m.duration > m.threshold * 3)) { // 3x threshold
      handleError(
        new Error('Significant performance degradation detected'), 
        'performance', 
        { slowMetrics, slowResources }
      );
    }
  }
}

/**
 * Set up periodic performance checks
 * @param intervalMs Interval between checks in milliseconds
 */
export function setupPerformanceMonitoring(intervalMs: number = 30000): () => void {
  // Clear performance buffer periodically to avoid memory issues
  performance.clearResourceTimings();
  
  // Set up interval for checking performance issues
  const intervalId = setInterval(() => {
    checkForPerformanceIssues();
    performance.clearResourceTimings();
  }, intervalMs);
  
  // Return function to stop monitoring
  return () => {
    clearInterval(intervalId);
  };
}