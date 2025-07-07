
import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Html5QrScannerProps {
  onScan: (result: string) => void;
  onError?: (error: any) => void;
  style?: React.CSSProperties;
}

export function Html5QrScanner({ onScan, onError, style }: Html5QrScannerProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const html5Qr = useRef<Html5Qrcode | null>(null);
  // Track scanning state to avoid calling stop/clear when not running
  const isScanning = useRef(false);

  useEffect(() => {
    if (!qrRef.current) return;
    const qr = new Html5Qrcode(qrRef.current.id);
    html5Qr.current = qr;
    isScanning.current = false;
    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        onScan(decodedText);
        if (isScanning.current) {
          isScanning.current = false;
          qr.stop().catch(() => {
            // Ignore stop errors
          });
        }
      },
      (err) => {
        // Handle NotFoundError and other camera errors gracefully
        if (onError) {
          if (err && err.name === 'NotFoundError') {
            onError({ message: 'No camera found or accessible on this device.' });
          } else if (err && err.message && err.message.includes('scanner is not running')) {
            // Ignore this error
          } else {
            onError(err);
          }
        }
      }
    ).then(() => {
      isScanning.current = true;
    }).catch((err) => {
      if (onError) onError(err);
    });
    return () => {
      // Only stop/clear if running, and only if methods exist
      if (html5Qr.current) {
        // Defensive: check for stop and clear existence and type
        const qr = html5Qr.current;
        if (typeof (qr.stop) === 'function' && isScanning.current) {
          isScanning.current = false;
          try { qr.stop(); } catch { /* ignore */ }
        }
        // Some builds of html5-qrcode may not have clear() at all
        if (typeof (qr.clear) === 'function') {
          try { qr.clear(); } catch { /* ignore */ }
        }
      }
    };
  }, [onScan, onError]);

  return <div id="html5qr" ref={qrRef} style={style} />;
}
