import { BrowserMultiFormatReader } from '@zxing/browser';
import React, { useState, useEffect, useRef } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

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
  const canvasRef = useRef(null);
  
  const [result, setResult] = useState(null);
  const [err, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('カメラの起動に失敗しました:', err);
        setError('カメラのアクセスが許可されていないか、デバイスが見つかりません。');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);
  const captureAndSend = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    setResult(null);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;


    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('画像の生成に失敗しました。');
        setIsScanning(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'barcode.jpg');

      try {
        const response = await fetch(`${API_BASE}/api/scan-barcode`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          setResult(data);
          const barcodeValue = data.barcode || '';
          onBarcodeChange(barcodeValue);
        } else {
          setError(data.detail || 'バーコードの読み取りに失敗しました。');
        }
      } catch (err) {
        console.error('通信エラー:', err);
        setError('サーバーとの通信に失敗しました。');
      } finally {
        setIsScanning(false);
      }
    }, 'image/jpeg', 0.8);
  };
  return (
    <div className="form">
      <label>バーコード(JAN)</label>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#000' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button
        onClick={captureAndSend}
        disabled={isScanning}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          fontSize: '16px',
          cursor: isScanning ? 'not-allowed' : 'pointer',
        }}
      >
        {isScanning ? '読み取り中...' : 'バーコードを撮影'}
      </button>

      <input
        value={barcode || result?.barcode || ''}
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
