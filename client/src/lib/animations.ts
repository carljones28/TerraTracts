/**
 * TerraTracts Animation Library
 * A collection of micro-interactions and animation utilities to enhance the UI experience
 */

// Animation timing constants for consistent timing across the platform
export const TIMING = {
  FAST: 150,      // Quick micro-interactions like button clicks
  MEDIUM: 300,    // Standard animations like fade transitions
  SLOW: 500,      // More elaborate animations like menu expansions
  VERY_SLOW: 800, // Major UI transformations
};

// Easing functions for natural-feeling animations
export const EASING = {
  // Standard easings
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  
  // Custom cubic-bezier curves for more expressive animations
  SNAP: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  SMOOTH: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  DECELERATE: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  ACCELERATE: 'cubic-bezier(0.4, 0.0, 1, 1)',
};

// CSS class generators for common transitions
export const generateTransitionClass = (
  properties: string[] = ['all'], 
  duration: number = TIMING.MEDIUM, 
  easing: string = EASING.EASE_IN_OUT, 
  delay: number = 0
): string => {
  return `transition-${properties.join(' transition-')} duration-${duration} ${easing} ${delay > 0 ? `delay-${delay}` : ''}`;
};

// CSS animation classes with keyframes for more complex animations
export const ANIMATIONS = {
  FADE_IN: "animate-fadeIn",
  FADE_OUT: "animate-fadeOut",
  SLIDE_IN_RIGHT: "animate-slideInRight",
  SLIDE_IN_LEFT: "animate-slideInLeft",
  SLIDE_IN_UP: "animate-slideInUp",
  SLIDE_IN_DOWN: "animate-slideInDown",
  PULSE: "animate-pulse",
  BOUNCE: "animate-bounce",
  SPIN: "animate-spin",
  PING: "animate-ping",
  SCALE_IN: "animate-scaleIn",
  SCALE_OUT: "animate-scaleOut",
  BREATHE: "animate-breathe",
  FLOAT_UP: "animate-floatUp",
  SHIMMER: "animate-shimmer",
  WAVE: "animate-wave",
  WIGGLE: "animate-wiggle",
  RIPPLE: "animate-ripple"
};

// Animation variants for property cards, buttons, etc.
export const VARIANTS = {
  CARD: {
    HOVER: "transition-transform transition-shadow duration-300 hover:shadow-lg hover:-translate-y-1",
    ACTIVE: "transition-transform transition-shadow duration-150 active:translate-y-0 active:shadow-md",
    COMBINED: "transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md"
  },
  BUTTON: {
    HOVER: "transition-colors duration-200",
    ACTIVE: "transition-transform duration-100 active:scale-95",
    COMBINED: "transition-all duration-200 hover:brightness-105 active:scale-95"
  },
  INPUT: {
    FOCUS: "transition-all duration-300 focus:ring-2 focus:ring-primary/50",
  },
  MENU: {
    ITEM: "transition-colors duration-150 hover:bg-primary/10",
  },
  ICON: {
    HOVER: "transition-transform duration-200 hover:scale-110",
    ROTATE: "transition-transform duration-200 hover:rotate-12",
  }
};

// Interactive UI states with animations
export const STATES = {
  HOVER: "hover:",
  FOCUS: "focus:",
  ACTIVE: "active:",
  GROUP_HOVER: "group-hover:",
  PEER_HOVER: "peer-hover:",
  DISABLED: "disabled:",
  SELECTED: "data-[state=selected]:",
};

// Scale transform utilities
export const SCALE = {
  NONE: "scale-100",
  SMALL: "scale-95",
  SMALLER: "scale-90",
  SMALLEST: "scale-75",
  LARGE: "scale-105",
  LARGER: "scale-110",
  LARGEST: "scale-125",
};

// Helper functions for dynamic animations
export const delayedItems = (baseDelay: number = 100) => {
  return (index: number): { animationDelay: string } => {
    return { animationDelay: `${index * baseDelay}ms` };
  };
};

// Stagger animation helper for lists
export const staggerChildren = (items: any[], baseDelay: number = 50) => {
  return items.map((item, index) => ({
    ...item,
    style: {
      ...item.style,
      animationDelay: `${index * baseDelay}ms`,
      transitionDelay: `${index * baseDelay}ms`,
    }
  }));
};