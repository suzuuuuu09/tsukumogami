import React, { useEffect, useRef, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

function RegisterForm({
  barcode,
  purchaseDate,
  status,
  error,
  onBarcodeChange,
  onPurchaseDateChange,
  onSubmit,
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [result, setResult] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const startCamera = async () => {
    if (streamRef.current) {
      setIsCameraActive(true)
      setCameraError('')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setCameraError('')
      setIsCameraActive(true)
    } catch (err) {
      console.error('カメラの起動に失敗しました:', err)
      setCameraError('カメラを起動できませんでした。端末の権限設定を確認してください。')
    }
  }

  const captureAndSend = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return

    setIsScanning(true)
    setResult(null)
    setCameraError('')

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCameraError('画像の生成に失敗しました。')
        setIsScanning(false)
        return
      }

      const formData = new FormData()
      formData.append('image', blob, 'barcode.jpg')

      try {
        const response = await fetch(`${API_BASE}/api/scan-barcode`, {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (response.ok) {
          setResult(data)
          onBarcodeChange(data.barcode || '')
        } else {
          setCameraError(data.detail || 'バーコードの読み取りに失敗しました。')
        }
      } catch (err) {
        console.error('送信エラー:', err)
        setCameraError('サーバーとの通信に失敗しました。')
      } finally {
        setIsScanning(false)
      }
    }, 'image/jpeg', 0.8)
  }

  return (
    <div className="form">
      <label>バーコード（JAN）</label>

      <div className={`camera-accordion ${isCameraActive ? 'is-open' : ''}`}>
        <button type="button" className="camera-trigger" onClick={startCamera}>
          <span className="camera-trigger-label">
            {isCameraActive ? 'カメラ起動中' : 'カメラを起動'}
          </span>
        </button>

        <div className="camera-scroll" aria-hidden={!isCameraActive}>
          <div className="camera-scroll-inner">
            <div className="camera-preview-frame">
              <video ref={videoRef} autoPlay playsInline className="camera-preview" />
            </div>
            <button
              type="button"
              className="camera-capture-button"
              onClick={captureAndSend}
              disabled={!isCameraActive || isScanning}
            >
              {isScanning ? '読み取り中...' : 'バーコードを撮影'}
            </button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="camera-canvas" />

      <label>バーコードを読み込めない場合は手動で入力してください</label>
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
        交換期限を登録
      </button>

      {status && <div className="status">{status}</div>}
      {(error || cameraError) && <div className="error">登録に失敗しました</div>}
    </div>
  )
}

export default RegisterForm
