declare module '@blackbox-vision/react-qr-reader' {
  import * as React from 'react';
  export interface QrReaderProps {
    constraints?: MediaStreamConstraints;
    onResult?: (result: { text: string } | null, error: any) => void;
    style?: React.CSSProperties;
    // ...other props as needed
  }
  export const QrReader: React.FC<QrReaderProps>;
  export default QrReader;
}
