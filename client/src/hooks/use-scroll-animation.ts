import { useState, useEffect, useRef, RefObject } from 'react';

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

/**
 * A hook that triggers animations when elements enter the viewport
 * 
 * @param options Configuration options:
 *   - threshold: Percentage of the element that needs to be in view (0-1)
 *   - rootMargin: Margin around the root element (CSS-style string, e.g. "10px 20px")
 *   - triggerOnce: Whether to trigger the animation only once
 *   - delay: Delay before animation starts after element is in view (ms)
 * @returns Object with ref to attach to element, isVisible status, and wasTriggered status
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
  delay = 0,
}: ScrollAnimationOptions = {}): {
  ref: RefObject<T>;
  isVisible: boolean;
  wasTriggered: boolean;
} {
  const [isVisible, setIsVisible] = useState(false);
  const [wasTriggered, setWasTriggered] = useState(false);
  const elementRef = useRef<T>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const currentElement = elementRef.current;
    
    if (!currentElement) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If triggerOnce is true and element was already triggered, do nothing
        if (triggerOnce && wasTriggered) return;
        
        if (entry.isIntersecting) {
          // If there's a delay, wait before setting visibility
          if (delay > 0) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            timeoutRef.current = setTimeout(() => {
              setIsVisible(true);
              setWasTriggered(true);
            }, delay);
          } else {
            setIsVisible(true);
            setWasTriggered(true);
          }
          
          // If triggerOnce is true, disconnect the observer after the element is visible
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          // If element is not in view and triggerOnce is false, hide the element
          setIsVisible(false);
          
          // Clear any pending timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      },
      {
        root: null, // Use the viewport as the root
        rootMargin,
        threshold,
      }
    );
    
    observer.observe(currentElement);
    
    // Cleanup function
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [threshold, rootMargin, triggerOnce, delay, wasTriggered]);
  
  return { ref: elementRef, isVisible, wasTriggered };
}