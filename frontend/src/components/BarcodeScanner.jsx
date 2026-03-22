import { BrowserMultiFormatReader } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';

export default function BarcodeScanner() {
  const videoRef = useRef(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    codeReader.decodeFromVideoDevice(
      null,
      videoRef.current,
      (result, err) => {
        if (result) {
          const text = result.getText();
          setCode(text);
        }
      }
    );

    return () => codeReader.reset();
  }, []);

  return (
    <div>
      <h2>バーコードスキャン!!</h2>
      <video ref={videoRef} style={{ width: '100%' }} />
      <p>読み取ったJANコード: {code}</p>
    </div>
  );
}