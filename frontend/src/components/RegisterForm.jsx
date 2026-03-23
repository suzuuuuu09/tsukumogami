import { BrowserMultiFormatReader } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';
function RegisterForm({
  barcode,
  purchaseDate,
  status,
  error,
  onBarcodeChange,
  onPurchaseDateChange,
  onSubmit,
}) {
  const videoRef = useRef(null);
  const [code, setCode] = useState('');

    
  const codeRead = () => {
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
  };
  return (
    <div className="form">
      <label>バーコード(JAN)</label>
      <div ref={videoRef} style={{ width: '100%', height: '200px' }}></div>
      <button type="button" onClick={codeRead}>
        カメラでスキャン
      </button>
      <input
        value={code}
        onChange={(event) => onBarcodeChange(event.target.value)}
        placeholder="例: 4901234567896"
      />
      <label>購入日</label>
      <input
        type="date"
        value={purchaseDate}
        onChange={(event) => onPurchaseDateChange(event.target.value)}
      />
      <button type="button" onClick={onSubmit}>
        物品を登録
      </button>
      {status && <div className="status"> {status}</div>}
      {error && <div className="error"> {error}</div>}
    </div>
  )
}

export default RegisterForm
