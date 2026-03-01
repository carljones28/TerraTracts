import React, { useState, useEffect, useRef } from 'react';
import { ANIMATIONS } from '@/lib/animations';

type AnimationName = keyof typeof ANIMATIONS;

interface AnimatedElementProps {
  children: React.ReactNode;
  animation: AnimationName | string;
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
  threshold?: number;
  as?: React.ElementType;
  onClick?: () => void;
}

/**
 * A wrapper component that adds animation to any element.
 * 
 * @param children - The element(s) to animate
 * @param animation - The animation to apply (from the ANIMATIONS object)
 * @param delay - Delay before animation starts (in ms)
 * @param duration - Custom duration of the animation (in ms)
 * @param className - Additional CSS classes to apply
 * @param triggerOnce - Whether the animation should only trigger once when in view
 * @param threshold - The percentage of the element that needs to be in view to trigger the animation (0-1)
 * @param as - The element type to render as (default: div)
 * @param onClick - Click handler function
 */
const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation,
  delay = 0,
  duration,
  className = '',
  triggerOnce = false,
  threshold = 0.1,
  as: Component = 'div',
  onClick,
  ...rest
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentElement = elementRef.current;
    
    if (!currentElement) return;
    
    // Create a new Intersection Observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update state when intersection changes
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          if (triggerOnce) {
            setHasAnimated(true);
            observer.unobserve(currentElement);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold,
      }
    );
    
    observer.observe(currentElement);
    
    // Cleanup
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold, triggerOnce]);

  // Determine whether to animate based on visibility and triggerOnce setting
  const shouldAnimate = triggerOnce ? isVisible && !hasAnimated : isVisible;
  
  // Handle animation class
  const animationClass = shouldAnimate ? 
    (ANIMATIONS[animation as AnimationName] || animation) : '';
  
  // Custom inline style for delay and duration
  const animationStyle = {
    animationDelay: delay ? `${delay}ms` : undefined,
    animationDuration: duration ? `${duration}ms` : undefined,
  };
  
  return (
    <Component
      ref={elementRef}
      className={`${className} ${animationClass}`}
      style={animationStyle}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Component>
  );
};

export { AnimatedElement };