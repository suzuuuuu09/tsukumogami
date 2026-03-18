import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const YAHOO_ITEM_SEARCH_URL = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch'
const STORAGE_KEY = 'tsukumogami-expiration-entries'
const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土']

const yokaiImageMap = {
  '河童': 'kappa.png',
  '九尾': 'kyuubi.png',
  '猫又': 'nekomata.png',
  'おばけ': 'obake.png',
  '一反木綿': 'ittanmomen.png',
  '一つ目小僧': 'hitotsume_kozou.png',
  '傘妖怪': 'kasa_youkai.png',
}

const yokaiList = Object.keys(yokaiImageMap)

function getRandomYokai() {
  return yokaiList[Math.floor(Math.random() * yokaiList.length)]
}

function toISODate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseISODate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDisplayDate(value) {
  if (!value) {
    return '未設定'
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parseISODate(value))
}

function formatMonthLabel(value) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
  }).format(value)
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(year, month, 1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)

    return {
      iso: toISODate(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: toISODate(date) === toISODate(new Date()),
    }
  })
}

function loadSavedEntries() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function App() {
  const [barcode, setBarcode] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(toISODate(new Date()))
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [headerYokai, setHeaderYokai] = useState(yokaiList[0])
  const [resultYokai, setResultYokai] = useState(yokaiList[0])
  const [activePage, setActivePage] = useState('register')
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [savedEntries, setSavedEntries] = useState(loadSavedEntries)

  useEffect(() => {
    const interval = setInterval(() => {
      setHeaderYokai((prev) => yokaiList[(yokaiList.indexOf(prev) + 1) % yokaiList.length])
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEntries))
  }, [savedEntries])

  const submit = async () => {
    const newYokai = getRandomYokai()
    setResultYokai(newYokai)
    setError('')
    setStatus('付喪神を召喚中… 煙がモクモク…')
    setResult(null)
    try {
      const resp = await fetch(`${API_BASE}/api/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          purchase_date: purchaseDate,
          request_url: YAHOO_ITEM_SEARCH_URL,
        }),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.detail || 'サーバーエラー')
      }
      const data = await resp.json()
      setResult(data)
      setSavedEntries((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          barcode,
          purchaseDate,
          productName: data.product_name,
          category: data.category,
          suggestedExpiration: data.suggested_expiration,
          reason: data.reason,
          productImage: data.product_image,
        },
        ...prev,
      ])
      const expirationDate = parseISODate(data.suggested_expiration)
      setCalendarMonth(new Date(expirationDate.getFullYear(), expirationDate.getMonth(), 1))
      setStatus('交換期限推定完了。付喪神が現れました！')
    } catch (e) {
      setError(e.message || '取得失敗')
      setStatus('')
    }
  }

  const itemsByDate = savedEntries.reduce((grouped, entry) => {
    if (!grouped[entry.suggestedExpiration]) {
      grouped[entry.suggestedExpiration] = []
    }
    grouped[entry.suggestedExpiration].push(entry)
    return grouped
  }, {})

  const calendarDays = buildCalendarDays(calendarMonth)
  const monthKey = `${calendarMonth.getFullYear()}-${`${calendarMonth.getMonth() + 1}`.padStart(2, '0')}`
  const monthlyEntries = [...savedEntries]
    .filter((entry) => entry.suggestedExpiration.startsWith(monthKey))
    .sort((left, right) => left.suggestedExpiration.localeCompare(right.suggestedExpiration))

  const upcomingEntry = [...savedEntries]
    .sort((left, right) => left.suggestedExpiration.localeCompare(right.suggestedExpiration))[0]

  const moveMonth = (offset) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  return (
    <div className="app">
      <div className="scene">
        <div className="moon" />
        <div className="cloud">付喪神 物の交換期限通知</div>
      </div>
      <div className="card">
        {activePage === 'register' ? (
          <div className="register-page">
            <div className="header">
              <div>
                <h1>レシートバーコードで交換期限を予測</h1>
                <p className="sub">和風の付喪神とともに商品を管理して、期限を日付で記録する。</p>
              </div>
              <div className="yokai">
                <img src={`/${yokaiImageMap[headerYokai]}`} alt={headerYokai} className="yokai-img" />
                <span>{headerYokai}が出現</span>
              </div>
            </div>

            <div className="summary-strip">
              <div className="summary-item">
                <span className="summary-label">登録件数</span>
                <strong>{savedEntries.length}件</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">直近の期限</span>
                <strong>{upcomingEntry ? formatDisplayDate(upcomingEntry.suggestedExpiration) : '未登録'}</strong>
              </div>
            </div>

            <div className="form">
              <label>バーコード(JAN)</label>
              <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="例: 4901234567896" />
              <label>購入日</label>
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
              <button type="button" onClick={submit}>交換期限を推測する</button>
              {status && <div className="status">🔥 {status}</div>}
              {error && <div className="error">⚠️ {error}</div>}
            </div>

            {result && (
              <div className="result">
                <div className="smoke">煙が漂い… カレンダーにも記録されました</div>
                <div className="yokai-appear">
                  <img src={`/${yokaiImageMap[resultYokai]}`} alt={resultYokai} className="yokai-display" />
                  <p className="yokai-text">{resultYokai}が出現した！</p>
                </div>
                <h2>付喪神が見つけた</h2>
                <p className="product">📦 {result.product_name}</p>
                <p className="category">🪓 カテゴリ: {result.category}</p>
                <p className="expiry">⏳ 期限日: {formatDisplayDate(result.suggested_expiration)}</p>
                <p className="reason">✍️ {result.reason}</p>
                {result.product_image && <img className="item-image" src={result.product_image} alt="商品" />}
              </div>
            )}
          </div>
        ) : (
          <div className="calendar-page">
            <div className="header calendar-header">
              <div>
                <h1>期限カレンダー</h1>
                <p className="sub">登録した交換期限を年月日で一覧し、月ごとに確認する。</p>
              </div>
              <div className="yokai calendar-yokai">
                <span>登録 {savedEntries.length} 件</span>
              </div>
            </div>

            <div className="calendar-controls">
              <button type="button" className="month-button" onClick={() => moveMonth(-1)}>前の月</button>
              <div className="calendar-month">{formatMonthLabel(calendarMonth)}</div>
              <button type="button" className="month-button" onClick={() => moveMonth(1)}>次の月</button>
            </div>

            {savedEntries.length === 0 ? (
              <div className="empty-state">登録ページで期限を推測すると、ここにカレンダー表示されます。</div>
            ) : (
              <div className="calendar-layout">
                <div className="calendar-grid-wrapper">
                  <div className="calendar-grid calendar-weekdays">
                    {weekdayLabels.map((label) => (
                      <div key={label} className="weekday">{label}</div>
                    ))}
                  </div>
                  <div className="calendar-grid calendar-days">
                    {calendarDays.map((day) => {
                      const dayItems = itemsByDate[day.iso] || []

                      return (
                        <div
                          key={day.iso}
                          className={`calendar-cell ${day.isCurrentMonth ? '' : 'outside'} ${day.isToday ? 'today' : ''}`}
                        >
                          <div className="calendar-cell-head">
                            <span className="calendar-date">{day.dayNumber}</span>
                            {dayItems.length > 0 && <span className="calendar-count">{dayItems.length}件</span>}
                          </div>
                          <div className="calendar-events">
                            {dayItems.slice(0, 2).map((entry) => (
                              <div key={entry.id} className="calendar-event" title={entry.productName}>
                                {entry.productName}
                              </div>
                            ))}
                            {dayItems.length > 2 && <div className="calendar-more">+{dayItems.length - 2}件</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <aside className="calendar-sidebar">
                  <h2>{formatMonthLabel(calendarMonth)}の期限一覧</h2>
                  {monthlyEntries.length === 0 ? (
                    <p className="sidebar-empty">この月に期限が来る登録はありません。</p>
                  ) : (
                    <div className="deadline-list">
                      {monthlyEntries.map((entry) => (
                        <div key={entry.id} className="deadline-item">
                          <p className="deadline-date">{formatDisplayDate(entry.suggestedExpiration)}</p>
                          <p className="deadline-name">{entry.productName}</p>
                          <p className="deadline-meta">購入日: {formatDisplayDate(entry.purchaseDate)}</p>
                          <p className="deadline-meta">カテゴリ: {entry.category}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </aside>
              </div>
            )}
          </div>
        )}
              <nav className="nav">
        <button
          type="button"
          className={`nav-button ${activePage === 'register' ? 'active' : ''}`}
          onClick={() => setActivePage('register')}
        >
          登録
        </button>
        <button
          type="button"
          className={`nav-button ${activePage === 'calendar' ? 'active' : ''}`}
          onClick={() => setActivePage('calendar')}
        >
          期限カレンダー
        </button>
      </nav>
      </div>
    </div>
  )
}

export default App
