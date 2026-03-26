import { useState } from 'react'
import { yokaiImageMap } from '../constants/yokai'
import { formatDisplayDate, formatMonthLabel } from '../utils/date'
import { getEntryYokai } from '../utils/entries'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

function MonthlyDeadlineList({ calendarMonth, monthlyEntries }) {
  const [selectedEntry, setSelectedEntry] = useState(null)

  return (
    <>
      <aside className="calendar-sidebar">
        <label style={{fontSize: "1.25rem"}}>{`${formatMonthLabel(calendarMonth)}の登録期限`}</label>
        {monthlyEntries.length === 0 ? (
          <p className="sidebar-empty">この月に登録期限を迎える食材妖怪はまだいません。</p>
        ) : (
          <div className="deadline-list">
            {monthlyEntries.map((entry) => {
              const yokai = getEntryYokai(entry)

              return (
                <article key={entry.id} className="deadline-item">
                  <div className="deadline-stage">
                    <div className="deadline-stage-sky">
                      <div className="deadline-stage-moon" aria-hidden="true" />
                      <div className="deadline-stage-cloud deadline-stage-cloud-left" aria-hidden="true" />
                      <div className="deadline-stage-cloud deadline-stage-cloud-right" aria-hidden="true" />
                      <div className="deadline-stage-cloud deadline-stage-cloud-low" aria-hidden="true" />
                      <div className="deadline-stage-firefly deadline-stage-firefly-left" aria-hidden="true" />
                      <div className="deadline-stage-firefly deadline-stage-firefly-right" aria-hidden="true" />
                    </div>
                    <div className="deadline-stage-hill deadline-stage-hill-back" aria-hidden="true" />
                    <div className="deadline-stage-hill deadline-stage-hill-front" aria-hidden="true" />
                    <div className="deadline-stage-grass" aria-hidden="true" />

                    <img className="deadline-card-image" src={`/${yokaiImageMap[yokai]}`} alt={yokai} />

                    <div className="deadline-card-body">
                      <p style={{fontSize: '0.7rem', fontWeight: '700', padding: '0px', margin: '0px'}}>{`交換期限は`}<br/><span style={{fontSize: '0.8rem', fontWeight: '700', color: 'var(--shu)'}}>{formatDisplayDate(entry.suggestedExpiration)}</span><br/>{`だよ`}</p>
                      <button
                        type="button"
                        className="deadline-card-button"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <MoreHorizIcon />
                      </button>
                    </div>

                    {entry.productImage ? (
                      <div className="deadline-card-crest deadline-card-crest-image">
                        <img src={entry.productImage} alt={entry.productName} />
                      </div>
                    ) : (
                      <div className="deadline-card-crest" aria-hidden="true">
                        品
                      </div>
                    )}

                    <div className="deadline-fusuma deadline-fusuma-left" aria-hidden="true">
                      <span className="deadline-fusuma-handle" />
                    </div>
                    <div className="deadline-fusuma deadline-fusuma-right" aria-hidden="true">
                      <span className="deadline-fusuma-handle" />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </aside>

      {selectedEntry && (
        <div className="calendar-modal-backdrop" onClick={() => setSelectedEntry(null)}>
          <div className="calendar-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="calendar-modal-close"
              onClick={() => setSelectedEntry(null)}
              aria-label="閉じる"
            >
              ×
            </button>
            <div className="calendar-modal-hero">
              <img
                src={`/${yokaiImageMap[getEntryYokai(selectedEntry)]}`}
                alt={getEntryYokai(selectedEntry)}
                className="calendar-modal-yokai"
              />
              <div className="calendar-modal-stamp-wrap">
                <img
                  src={selectedEntry.completed ? '/tassei.png' : '/mitatsu.png'}
                  alt={selectedEntry.completed ? '達成' : '未達'}
                  className="calendar-modal-stamp"
                />
              </div>
            </div>
            <div className="calendar-modal-content">
              <h3 className="calendar-modal-title">{selectedEntry.productName}</h3>
              <p className="calendar-modal-meta">{`購入日: ${formatDisplayDate(selectedEntry.purchaseDate)}`}</p>
              <p className="calendar-modal-meta">{`交換期限: ${formatDisplayDate(selectedEntry.suggestedExpiration)}`}</p>
              <p className="calendar-modal-meta">{`カテゴリ: ${selectedEntry.category}`}</p>
              {selectedEntry.reason && <p className="calendar-modal-reason">{selectedEntry.reason}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MonthlyDeadlineList
