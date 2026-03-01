/**
 * TerraNova Vision - Performance Optimization Utilities
 * Utility functions for optimizing and measuring application performance
 */

/**
 * Measures the execution time of a function
 * @param fn The function to measure
 * @param args Arguments to pass to the function
 * @returns The result of the function and the execution time in milliseconds
 */
export async function measureExecutionTime<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T> | T, 
  ...args: Args
): Promise<{ result: T, executionTime: number }> {
  const startTime = performance.now();
  const result = await fn(...args);
  const endTime = performance.now();
  return { 
    result, 
    executionTime: endTime - startTime 
  };
}

/**
 * Creates a debounced version of a function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Creates a throttled version of a function
 * @param fn The function to throttle
 * @param limit The time limit in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const now = Date.now();
    
    if (now - lastCall < limit) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        lastCall = now;
        fn(...args);
        timeoutId = null;
      }, limit - (now - lastCall));
      
      return;
    }
    
    lastCall = now;
    fn(...args);
  };
}

/**
 * Memoizes a function to cache its results
 * @param fn The function to memoize
 * @returns A memoized version of the function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Lazy loads an image
 * @param src The image source URL
 * @returns A promise that resolves when the image is loaded
 */
export function lazyLoadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Prefetches resources
 * @param urls The URLs to prefetch
 */
export function prefetchResources(urls: string[]): void {
  for (const url of urls) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }
}

/**
 * Performance monitoring class for tracking and reporting performance metrics
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private maxSamples: number = 10;
  
  /**
   * Starts measuring a performance metric
   * @param name The name of the metric
   * @returns A function to stop measuring
   */
  startMeasure(name: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMeasurement(name, duration);
      return duration;
    };
  }
  
  /**
   * Records a measurement
   * @param name The name of the metric
   * @param duration The duration in milliseconds
   */
  recordMeasurement(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    const samples = this.measurements.get(name)!;
    samples.push(duration);
    
    // Keep only the latest maxSamples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }
  
  /**
   * Gets the average duration of a metric
   * @param name The name of the metric
   * @returns The average duration in milliseconds
   */
  getAverageDuration(name: string): number | null {
    const samples = this.measurements.get(name);
    
    if (!samples || samples.length === 0) {
      return null;
    }
    
    const sum = samples.reduce((acc, duration) => acc + duration, 0);
    return sum / samples.length;
  }
  
  /**
   * Gets all recorded metrics
   * @returns A record of metric names and their average durations
   */
  getAllMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    
    // Use Array.from to convert Map keys to array to avoid iteration issues
    Array.from(this.measurements.keys()).forEach(name => {
      const average = this.getAverageDuration(name);
      
      if (average !== null) {
        result[name] = average;
      }
    });
    
    return result;
  }
  
  /**
   * Clears all recorded measurements
   */
  clear(): void {
    this.measurements.clear();
  }
}

// Export a singleton instance of the performance monitor
export const performanceMonitor = new PerformanceMonitor();