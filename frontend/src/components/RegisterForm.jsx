function RegisterForm({
  barcode,
  purchaseDate,
  status,
  error,
  onBarcodeChange,
  onPurchaseDateChange,
  onSubmit,
}) {
  return (
    <div className="form">
      <label>バーコード(JAN)</label>
      <input
        value={barcode}
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
