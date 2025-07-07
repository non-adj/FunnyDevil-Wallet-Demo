import React from 'react';
import QrScanner from 'react-qr-scanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (err: any) => void;
  style?: React.CSSProperties;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, style }) => {
  // react-qr-scanner returns an object with a 'text' property (for QR code), or a string for legacy
  const handleScan = (data: any) => {
    if (!data) return;
    if (typeof data === 'string') {
      onScan(data);
    } else if (typeof data === 'object' && data.text) {
      onScan(data.text);
    }
  };
  const handleError = (err: any) => {
    if (onError) onError(err);
  };
  return (
    <div style={style}>
      <QrScanner
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: '100%' }}
        constraints={{ facingMode: 'environment' }}
      />
    </div>
  );
};
