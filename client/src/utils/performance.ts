// Performance utilities and optimizations

// Debounce function for search and filter inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Image preloader for better perceived performance
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Batch image preloader
export async function preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
  const promises = sources.map(preloadImage);
  return Promise.all(promises);
}

// Format price with memoization for performance
const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

// Format number with memoization
const numberFormatter = new Intl.NumberFormat('en-US');

export function formatNumber(num: number): string {
  return numberFormatter.format(num);
}

// Intersection Observer hook for lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  });
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  startTiming(key: string): void {
    this.metrics.set(key, performance.now());
  }

  endTiming(key: string): number {
    const start = this.metrics.get(key);
    if (start) {
      const duration = performance.now() - start;
      this.metrics.delete(key);
      return duration;
    }
    return 0;
  }

  logTiming(key: string, operation: string): void {
    const duration = this.endTiming(key);
    if (duration > 0) {
      console.log(`⚡ ${operation}: ${duration.toFixed(2)}ms`);
    }
  }
}

// Memory usage monitoring
export function getMemoryUsage(): MemoryInfo | null {
  // @ts-ignore
  return performance.memory || null;
}

// Connection speed detection
export function getConnectionSpeed(): string {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    if (connection.effectiveType) {
      return connection.effectiveType;
    }
    if (connection.downlink) {
      if (connection.downlink >= 10) return 'fast';
      if (connection.downlink >= 1.5) return 'moderate';
      return 'slow';
    }
  }
  
  return 'unknown';
}

// Adaptive loading based on connection speed
export function shouldUseOptimizedVersion(): boolean {
  const speed = getConnectionSpeed();
  return speed === 'slow' || speed === '2g';
}