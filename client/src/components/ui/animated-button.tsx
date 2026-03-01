import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { VARIANTS, TIMING, EASING } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  hoverEffect?: 'scale' | 'lift' | 'glow' | 'pulse' | 'none';
  clickEffect?: 'press' | 'bounce' | 'ripple' | 'none';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * An extended Button component with built-in micro-animations
 * 
 * @param hoverEffect - The effect to apply on hover
 * @param clickEffect - The effect to apply on click
 * @param iconLeft - Icon to show before the button text
 * @param iconRight - Icon to show after the button text
 * @param isLoading - Whether the button is in a loading state
 * @param loadingText - Text to show while loading
 */
const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  hoverEffect = 'scale',
  clickEffect = 'press',
  iconLeft,
  iconRight,
  isLoading = false,
  loadingText,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  // Apply different hover animations based on the hoverEffect prop
  const getHoverClass = () => {
    switch (hoverEffect) {
      case 'scale':
        return 'hover:scale-105 transition-transform duration-200';
      case 'lift':
        return 'hover:-translate-y-1 transition-transform duration-200';
      case 'glow':
        return 'hover:shadow-[0_0_15px_rgba(var(--primary-rgb)/0.5)] transition-shadow duration-300';
      case 'pulse':
        return 'hover:animate-pulse';
      case 'none':
      default:
        return '';
    }
  };
  
  // Apply different click animations based on the clickEffect prop
  const getClickClass = () => {
    switch (clickEffect) {
      case 'press':
        return isPressed ? 'scale-95 transition-transform duration-100' : '';
      case 'bounce':
        return isPressed ? 'animate-bounce' : '';
      case 'ripple':
        // Ripple effect is handled differently - we'll apply it on click
        return '';
      case 'none':
      default:
        return '';
    }
  };
  
  // Handle mouse down/up for press animation
  const handleMouseDown = () => {
    setIsPressed(true);
  };
  
  const handleMouseUp = () => {
    setIsPressed(false);
  };
  
  // Create ripple effect
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (clickEffect !== 'ripple') return;
    
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'absolute rounded-full bg-white bg-opacity-30 pointer-events-none';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 600ms linear forwards';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      button.removeChild(ripple);
    }, 700);
  };
  
  return (
    <Button
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        getHoverClass(),
        getClickClass(),
        isLoading && 'opacity-90 cursor-wait',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        handleRipple(e);
        if (props.onClick) props.onClick(e);
      }}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          {loadingText || children}
        </>
      ) : (
        <>
          {iconLeft && <span className="mr-2">{iconLeft}</span>}
          {children}
          {iconRight && <span className="ml-2">{iconRight}</span>}
        </>
      )}
    </Button>
  );
};

export { AnimatedButton };