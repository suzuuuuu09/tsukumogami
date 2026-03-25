import CalendarGrid from '../components/CalendarGrid'
import MonthlyDeadlineList from '../components/MonthlyDeadlineList'
import PageHeader from '../components/PageHeader'
import { yokaiList } from '../constants/yokai'
import { formatMonthLabel } from '../utils/date'

function CalendarPage({ calendarMonth, itemsByDate, monthlyEntries, savedEntries, focusDate, onMoveMonth, onEntryComplete }) {
  const headerBadges = yokaiList.slice(0, Math.min(3, Math.max(savedEntries.length, 1))).map((yokai, i) => ({
    variant: 'image',
    yokai,
    label: `月次${i + 1}`,
  }))

  return (
    <div className="calendar-page">
      <PageHeader
        title="交換期限カレンダー"
        subtitle="宿した妖怪と交換期限を月ごとに見渡せます。"
        badge={{
          items: [...headerBadges, { variant: 'count', label: `登録 ${savedEntries.length} 件` }],
        }}
      />

      <div className="calendar-controls">
        <button type="button" className="month-button" onClick={() => onMoveMonth(-1)}>
          前の月
        </button>
        <div className="calendar-month">{formatMonthLabel(calendarMonth)}</div>
        <button type="button" className="month-button" onClick={() => onMoveMonth(1)}>
          次の月
        </button>
      </div>

      {savedEntries.length === 0 ? (
        <div className="empty-state">登録品がまだありません。まずは交換期限を登録してカレンダーを表示しましょう。</div>
      ) : (
        <div className="calendar-layout">
          <CalendarGrid
            calendarMonth={calendarMonth}
            itemsByDate={itemsByDate}
            focusDate={focusDate}
            onEntryComplete={onEntryComplete}
          />
          <MonthlyDeadlineList calendarMonth={calendarMonth} monthlyEntries={monthlyEntries} />
        </div>
      )}
    </div>
  )
}

export default CalendarPage
