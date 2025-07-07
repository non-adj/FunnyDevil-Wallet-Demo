declare module 'react-qr-reader' {
  import * as React from 'react';
  export interface QrReaderProps {
    delay?: number | false;
    onError?: (error: any) => void;
    onScan?: (data: string | null) => void;
    style?: React.CSSProperties;
    constraints?: MediaStreamConstraints;
    onResult?: (result: { getText: () => string } | null, error: any) => void;
  }
  export const QrReader: React.FC<QrReaderProps>;
  export default QrReader;
}
