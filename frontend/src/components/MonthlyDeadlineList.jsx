import { yokaiImageMap } from '../constants/yokai'
import { formatDisplayDate, formatMonthLabel } from '../utils/date'
import { getEntryYokai } from '../utils/entries'

function MonthlyDeadlineList({ calendarMonth, monthlyEntries }) {
  return (
    <aside className="calendar-sidebar">
      <h2>{formatMonthLabel(calendarMonth)}の交換期限</h2>
      {monthlyEntries.length === 0 ? (
        <p className="sidebar-empty">この月に交換期限を迎える登録品はまだありません。</p>
      ) : (
        <div className="deadline-list">
          {monthlyEntries.map((entry) => {
            const yokai = getEntryYokai(entry)

            return (
              <article key={entry.id} className="deadline-item">
                <div className="deadline-card-header">
                  <img className="deadline-card-image" src={`/${yokaiImageMap[yokai]}`} alt={yokai} />
                  {entry.productImage ? (
                    <div className="deadline-card-crest deadline-card-crest-image">
                      <img src={entry.productImage} alt={entry.productName} />
                    </div>
                  ) : (
                    <div className="deadline-card-crest" aria-hidden="true">
                      品
                    </div>
                  )}
                </div>
                <div className="deadline-card-body">
                  <p className="deadline-kicker">交換期限</p>
                  <p className="deadline-date">{formatDisplayDate(entry.suggestedExpiration)}</p>
                  <div className="deadline-card-details">
                    <p className="deadline-name">{entry.productName}</p>
                    <p className="deadline-meta">召喚妖怪: {yokai}</p>
                    <p className="deadline-meta">購入日: {formatDisplayDate(entry.purchaseDate)}</p>
                    <p className="deadline-meta">カテゴリ: {entry.category}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </aside>
  )
}

export default MonthlyDeadlineList
