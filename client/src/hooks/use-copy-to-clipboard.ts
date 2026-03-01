import { useState, useCallback } from 'react';

type CopiedValue = string | null;
type CopyFn = (text: string) => Promise<boolean>;

/**
 * Custom hook for copying text to clipboard with state management
 * @returns Methods and state for clipboard operations
 */
export function useCopyToClipboard(): { 
  copied: boolean; 
  copy: CopyFn; 
  resetCopied: () => void;
} {
  const [copied, setCopied] = useState<boolean>(false);

  const copy: CopyFn = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard API not available');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Auto-reset the copied state after 3 seconds
      setTimeout(() => {
        setCopied(false);
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Failed to copy text: ', error);
      setCopied(false);
      return false;
    }
  }, []);

  const resetCopied = useCallback(() => {
    setCopied(false);
  }, []);

  return { copied, copy, resetCopied };
}