import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * Custom hook for generating QR codes
 * @param text The text to encode in the QR code
 * @returns Object containing the QR code data URL and loading/error states
 */
export function useQRCode(text: string) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!text) {
      setQrCodeDataUrl(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const generateQrCode = async () => {
      try {
        const url = await QRCode.toDataURL(text, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 200,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeDataUrl(url);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    generateQrCode();
  }, [text]);

  return {
    qrCodeDataUrl,
    isLoading,
    error
  };
}