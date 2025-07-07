declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      cameraConfig: any,
      config: { fps: number; qrbox: number },
      onSuccess: (decodedText: string) => void,
      onError: (error: any) => void
    ): Promise<void>;
    stop(): Promise<void>;
    clear(): Promise<void>;
  }
}
