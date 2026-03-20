import { useEffect, useState } from 'react'
import './App.css'
import AppNavigation from './components/AppNavigation'
import SceneHeader from './components/SceneHeader'
import { getRandomYokai, yokaiList } from './constants/yokai'
import CalendarPage from './pages/CalendarPage'
import RegisterPage from './pages/RegisterPage'
import {
  createSavedEntry,
  getItemsByDate,
  getMonthlyEntries,
  getUpcomingEntry,
} from './utils/entries'
import { getInitialCalendarMonth, parseISODate, toISODate } from './utils/date'
import { loadSavedEntries, saveSavedEntries } from './utils/storage'
import { requestExpirationEstimate } from './api/estimateApi'

function App() {
  const [barcode, setBarcode] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => toISODate(new Date()))
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [headerYokai, setHeaderYokai] = useState(yokaiList[0])
  const [resultYokai, setResultYokai] = useState(yokaiList[0])
  const [activePage, setActivePage] = useState('register')
  const [calendarMonth, setCalendarMonth] = useState(getInitialCalendarMonth)
  const [savedEntries, setSavedEntries] = useState(loadSavedEntries)

  useEffect(() => {
    const interval = setInterval(() => {
      setHeaderYokai((prev) => yokaiList[(yokaiList.indexOf(prev) + 1) % yokaiList.length])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    saveSavedEntries(savedEntries)
  }, [savedEntries])

  const handleSubmit = async () => {
    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        new Notification('物品登録完了！', {
          body: '物品の登録が完了しました。交換期限が近づいたらお知らせします',
        });
      }
    } catch (notificationError) {
      console.error('この端末では通知を表示できませんでしたが、登録処理は完了しています。', notificationError);
    }
    const newYokai = getRandomYokai()
    setResultYokai(newYokai)
    setError('')
    setStatus('付喪神を召喚中… ')
    setResult(null)

    try {
      const estimate = await requestExpirationEstimate({ barcode, purchaseDate })

      setResult(estimate)
      setSavedEntries((prev) => [createSavedEntry({ barcode, purchaseDate, estimate }), ...prev])

      const expirationDate = parseISODate(estimate.suggested_expiration)
      setCalendarMonth(new Date(expirationDate.getFullYear(), expirationDate.getMonth(), 1))
      setStatus('交換期限推定完了。付喪神が現れました！')
    } catch (submissionError) {
      setError(submissionError.message || '取得失敗')
      setStatus('')
    }
  }

  const itemsByDate = getItemsByDate(savedEntries)
  const monthlyEntries = getMonthlyEntries(savedEntries, calendarMonth)
  const upcomingEntry = getUpcomingEntry(savedEntries)


  return (
    <div className="app">
      <SceneHeader />
      <div className="card">
        <AppNavigation activePage={activePage} onPageChange={setActivePage} />
        {activePage === 'register' ? (
          <RegisterPage
            barcode={barcode}
            purchaseDate={purchaseDate}
            status={status}
            error={error}
            result={result}
            headerYokai={headerYokai}
            resultYokai={resultYokai}
            savedEntries={savedEntries}
            upcomingEntry={upcomingEntry}
            onBarcodeChange={setBarcode}
            onPurchaseDateChange={setPurchaseDate}
            onSubmit={handleSubmit}
          />
        ) : (
          <CalendarPage
            calendarMonth={calendarMonth}
            itemsByDate={itemsByDate}
            monthlyEntries={monthlyEntries}
            savedEntries={savedEntries}
            onMoveMonth={(offset) => {
              setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
