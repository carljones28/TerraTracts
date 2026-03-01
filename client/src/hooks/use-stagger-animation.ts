import { useState, useRef, useCallback, useEffect } from 'react';

interface StaggerOptions {
  baseDelay: number;
  staggerDelay: number;
  onComplete?: () => void;
  resetAfter?: number | null;
}

/**
 * A hook to handle staggered animations for lists of elements.
 * 
 * @param itemCount The number of items to animate
 * @param options Animation options: baseDelay, staggerDelay, onComplete, resetAfter
 * @returns Object with isAnimating, start function, and getItemProps to apply to each item
 */
export function useStaggerAnimation(
  itemCount: number,
  options: StaggerOptions = {
    baseDelay: 0,
    staggerDelay: 50,
    resetAfter: null
  }
) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedItems, setAnimatedItems] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { baseDelay, staggerDelay, onComplete, resetAfter } = options;
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Reset animation after specified time if provided
  useEffect(() => {
    if (resetAfter && isAnimating && animatedItems.length === itemCount) {
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        setAnimatedItems([]);
      }, resetAfter);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isAnimating, animatedItems.length, itemCount, resetAfter]);
  
  // Start the animation sequence
  const start = useCallback(() => {
    setIsAnimating(true);
    setAnimatedItems([]);
    
    // Stagger the animation of each item
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setAnimatedItems(prev => {
          const newItems = [...prev, i];
          
          // If this is the last item, call onComplete callback
          if (newItems.length === itemCount && onComplete) {
            setTimeout(onComplete, 100);
          }
          
          return newItems;
        });
      }, baseDelay + i * staggerDelay);
    }
  }, [itemCount, baseDelay, staggerDelay, onComplete]);
  
  // Reset the animation
  const reset = useCallback(() => {
    setIsAnimating(false);
    setAnimatedItems([]);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // Get props for each animated item
  const getItemProps = useCallback(
    (index: number) => {
      const isVisible = animatedItems.includes(index);
      const delay = index * staggerDelay;
      
      return {
        style: {
          visibility: isAnimating ? 'visible' as const : 'hidden' as const,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'none' : 'translateY(20px)',
          transition: `opacity ${staggerDelay}ms ease-out, transform ${staggerDelay}ms ease-out`,
          transitionDelay: `${delay}ms`,
        },
      };
    },
    [isAnimating, animatedItems, staggerDelay]
  );
  
  return {
    isAnimating,
    animatedItems,
    start,
    reset,
    getItemProps,
  };
}