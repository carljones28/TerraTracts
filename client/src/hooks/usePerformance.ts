import { useEffect, useState, useCallback } from 'react';
import { PerformanceMonitor, getConnectionSpeed, shouldUseOptimizedVersion } from '../utils/performance';

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const startTiming = useCallback((key: string) => {
    monitor.startTiming(key);
  }, [monitor]);

  const endTiming = useCallback((key: string, operation?: string) => {
    if (operation) {
      monitor.logTiming(key, operation);
    } else {
      return monitor.endTiming(key);
    }
  }, [monitor]);

  return { startTiming, endTiming };
}

// Hook for connection speed monitoring
export function useConnectionSpeed() {
  const [speed, setSpeed] = useState(getConnectionSpeed());
  const [isOptimized, setIsOptimized] = useState(shouldUseOptimizedVersion());

  useEffect(() => {
    const updateSpeed = () => {
      const newSpeed = getConnectionSpeed();
      setSpeed(newSpeed);
      setIsOptimized(shouldUseOptimizedVersion());
    };

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateSpeed);
      return () => connection.removeEventListener('change', updateSpeed);
    }
  }, []);

  return { speed, isOptimized };
}

// Hook for viewport tracking
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

// Hook for memory monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const updateMemory = () => {
      // @ts-ignore
      const memory = performance.memory;
      if (memory) {
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        } as MemoryInfo);
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}