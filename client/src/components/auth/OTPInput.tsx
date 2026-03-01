import React, { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OTPInput({ 
  value = '', 
  onChange, 
  length = 6,
  disabled = false 
}: OTPInputProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const getOTPValue = () => {
    return value.padEnd(length, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const target = e.target;
    const newValue = target.value;

    if (newValue === '') return;

    // Get only the last character
    const digit = newValue.slice(-1);
    
    // Check if it's a digit
    if (!/^\d+$/.test(digit)) return;

    // Update value
    const newOtp = getOTPValue().split('');
    newOtp[index] = digit;
    onChange(newOtp.join('').trim());

    // Focus next input
    if (index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      // Clear current and go to previous
      const newOtp = getOTPValue().split('');
      newOtp[index] = '';
      onChange(newOtp.join('').trim());
      
      if (index > 0) {
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // If it contains only digits and has correct length, set value
    if (/^\d+$/.test(pastedData) && pastedData.length <= length) {
      onChange(pastedData);
      setActiveIndex(Math.min(pastedData.length, length - 1));
    }
  };

  // Update input refs when length changes
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Keep focus on active input
  useEffect(() => {
    inputRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => {
        const digit = getOTPValue()[index] || '';
        const isActive = index === activeIndex;

        return (
          <div 
            key={index}
            className={cn(
              "relative w-10 h-14 flex items-center justify-center border rounded-md transition-all",
              isActive ? "border-primary" : "border-border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              ref={el => {
                if (el) inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={() => setActiveIndex(index)}
              className={cn(
                "w-full h-full text-center bg-transparent text-xl font-semibold focus:outline-none caret-transparent",
                isActive && "bg-primary/5"
              )}
            />
            {isActive && digit === '' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-px h-7 bg-primary animate-pulse"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}