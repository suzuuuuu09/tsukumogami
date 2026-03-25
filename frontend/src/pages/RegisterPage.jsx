import PageHeader from '../components/PageHeader'
import RegisterForm from '../components/RegisterForm'
import RegistrationSummary from '../components/RegistrationSummary'
import ResultCard from '../components/ResultCard'

function RegisterPage({
  barcode,
  purchaseDate,
  status,
  error,
  result,
  headerYokai,
  resultYokai,
  savedEntries,
  upcomingEntry,
  onMoveToRegisteredDate,
  onBarcodeChange,
  onPurchaseDateChange,
  onSubmit,
}) {
  return (
    <div className="register-page">
      <PageHeader
        title="バーコードを読み取り交換期限を登録"
        subtitle="付喪神と共に物品を記録して、交換期限をお知らせします。"
        badge={{ variant: 'image', yokai: headerYokai, label: `${headerYokai}` }}
      />

      <RegistrationSummary savedEntriesCount={savedEntries.length} upcomingEntry={upcomingEntry} />

      <RegisterForm
        barcode={barcode}
        purchaseDate={purchaseDate}
        status={status}
        error={error}
        onBarcodeChange={onBarcodeChange}
        onPurchaseDateChange={onPurchaseDateChange}
        onSubmit={onSubmit}
      />

      <ResultCard result={result} resultYokai={resultYokai} />

      {result && (
        <button type="button" className="calendar-jump-button" onClick={onMoveToRegisteredDate}>
          カレンダーへ移動
        </button>
      )}
    </div>
  )
}

export default RegisterPage
