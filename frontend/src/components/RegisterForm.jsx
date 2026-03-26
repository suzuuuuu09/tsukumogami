import React, { useEffect, useRef, useState } from 'react'

function RegisterForm({
  barcode,
  purchaseDate,
  status,
  error,
  onBarcodeChange,
  onPurchaseDateChange,
  onSubmit,
}) {
  const scannerRef = useRef(null)
  const lastDetectedCodeRef = useRef('')
  const lastDetectedAtRef = useRef(0)
  const detectedHandlerRef = useRef(null)
  const processedHandlerRef = useRef(null)

  const [cameraError, setCameraError] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [scannerMessage, setScannerMessage] = useState('')

  const stopScanner = (shouldResetState = true) => {
    const quagga = window.Quagga

    if (quagga) {
      if (detectedHandlerRef.current) {
        quagga.offDetected(detectedHandlerRef.current)
        detectedHandlerRef.current = null
      }

      if (processedHandlerRef.current) {
        quagga.offProcessed(processedHandlerRef.current)
        processedHandlerRef.current = null
      }

      try {
        quagga.stop()
      } catch (scannerStopError) {
        console.error('Failed to stop scanner:', scannerStopError)
      }
    }

    if (scannerRef.current) {
      scannerRef.current.innerHTML = ''
    }

    if (shouldResetState) {
      setIsCameraActive(false)
      setIsStartingCamera(false)
    }
  }

  useEffect(() => () => stopScanner(false), [])

  const startScanner = async () => {
    if (isCameraActive || isStartingCamera) {
      return
    }

    if (!window.Quagga) {
      setCameraError('バーコードスキャナーの読み込みに失敗しました。')
      return
    }

    if (!scannerRef.current) {
      setCameraError('カメラの表示領域を初期化できませんでした。')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('このブラウザではカメラを利用できません。')
      return
    }

    setIsStartingCamera(true)
    setCameraError('')
    setScannerMessage('カメラを起動しています...')
    lastDetectedCodeRef.current = ''
    lastDetectedAtRef.current = 0

    const quagga = window.Quagga

    quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
        numOfWorkers: navigator.hardwareConcurrency
          ? Math.min(4, navigator.hardwareConcurrency)
          : 2,
        frequency: 10,
        locate: true,
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader'],
        },
      },
      (initError) => {
        if (initError) {
          console.error('Failed to initialize Quagga:', initError)
          setCameraError('カメラを起動できませんでした。権限設定を確認してください。')
          setScannerMessage('')
          setIsStartingCamera(false)
          return
        }

        processedHandlerRef.current = (result) => {
          const drawingCtx = quagga.canvas?.ctx?.overlay
          const drawingCanvas = quagga.canvas?.dom?.overlay

          if (!drawingCtx || !drawingCanvas) {
            return
          }

          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)

          if (result?.box) {
            quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
              color: '#cc3528',
              lineWidth: 3,
            })
          }
        }

        detectedHandlerRef.current = (result) => {
          const code = result?.codeResult?.code?.trim()

          if (!code) {
            return
          }

          const now = Date.now()
          if (
            code === lastDetectedCodeRef.current &&
            now - lastDetectedAtRef.current < 1500
          ) {
            return
          }

          lastDetectedCodeRef.current = code
          lastDetectedAtRef.current = now
          onBarcodeChange(code)
          alert(`読み取り成功！: ${code}`)
          setScannerMessage(`バーコードを読み取りました: ${code}`)
          stopScanner()
        }

        quagga.onProcessed(processedHandlerRef.current)
        quagga.onDetected(detectedHandlerRef.current)
        quagga.start()
        setIsCameraActive(true)
        setIsStartingCamera(false)
        setScannerMessage('バーコードをカメラにかざしてください。')
      },
    )
  }

  const handleCameraToggle = async () => {
    if (isCameraActive) {
      stopScanner()
      setScannerMessage('')
      return
    }

    await startScanner()
  }

  return (
    <div className="form">
      <label htmlFor="barcode">バーコード（JAN / UPC）</label>
      {!scannerMessage ?( <small style={{ color: "#cc3528", fontSize: "0.8rem", fontWeight: "700" }}>カメラで読み取れない場合は手入力してください</small>
        ) : (
          <small style={{ color: "#5c3066", fontSize: "0.8rem", fontWeight: "700" }}>{scannerMessage}</small>
        )
      }
      <input
        id="barcode"
        value={barcode}
        onChange={(event) => onBarcodeChange(event.target.value)}
        placeholder="例: 4901234567896"
      />

      <div className={`camera-accordion ${isCameraActive || isStartingCamera ? 'is-open' : ''}`}>
        <button
          type="button"
          className="camera-trigger"
          onClick={handleCameraToggle}
          disabled={isStartingCamera}
        >
          <span className="camera-trigger-label">
            {isStartingCamera ? 'カメラを起動中...' : isCameraActive ? 'カメラを停止' : 'カメラで読み取る'}
          </span>
        </button>

        <div className="camera-scroll" aria-hidden={!isCameraActive && !isStartingCamera}>
          <div className="camera-scroll-inner">
            <div className="camera-preview-frame">
              <div ref={scannerRef} className="camera-preview" />
            </div>
          </div>
        </div>
      </div>


      <label htmlFor="purchaseDate">購入日</label>
      <input
        id="purchaseDate"
        type="date"
        value={purchaseDate}
        onChange={(event) => onPurchaseDateChange(event.target.value)}
      />

      <button type="button" onClick={onSubmit}>
        物品を登録
      </button>

      {status && <div className="status">{status}</div>}
      {(error || cameraError) && <div className="error">登録に失敗しました</div>}
    </div>
  )
}

export default RegisterForm
