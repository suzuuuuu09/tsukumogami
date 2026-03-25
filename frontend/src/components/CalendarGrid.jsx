import { useEffect, useRef, useState } from 'react'
import { weekdayLabels } from '../constants/calendar'
import { yokaiImageMap } from '../constants/yokai'
import { buildCalendarDays, formatDisplayDate } from '../utils/date'
import { getEntryYokai } from '../utils/entries'

function CalendarGrid({ calendarMonth, itemsByDate, focusDate, onEntryComplete }) {
  const calendarDays = buildCalendarDays(calendarMonth)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [overflowEntries, setOverflowEntries] = useState(null)
  const [animatedStampDates, setAnimatedStampDates] = useState({})
  const previousCompletionRef = useRef({})
  const focusCellRef = useRef(null)

  useEffect(() => {
    const nextCompletionState = {}
    const newlyCompletedDates = []

    Object.entries(itemsByDate).forEach(([iso, entries]) => {
      const isComplete = entries.length > 0 && entries.every((entry) => entry.completed)
      nextCompletionState[iso] = isComplete

      if (isComplete && previousCompletionRef.current[iso] === false) {
        newlyCompletedDates.push(iso)
      }
    })

    previousCompletionRef.current = nextCompletionState

    if (newlyCompletedDates.length > 0) {
      setAnimatedStampDates((current) => {
        const next = { ...current }
        newlyCompletedDates.forEach((iso) => {
          next[iso] = true
        })
        return next
      })

      const timeout = setTimeout(() => {
        setAnimatedStampDates((current) => {
          const next = { ...current }
          newlyCompletedDates.forEach((iso) => {
            delete next[iso]
          })
          return next
        })
      }, 900)

      return () => clearTimeout(timeout)
    }
  }, [itemsByDate])

  useEffect(() => {
    if (!focusDate || !focusCellRef.current) {
      return
    }

    focusCellRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [focusDate, calendarMonth])

  const openEntryDetails = (entry) => {
    setOverflowEntries(null)
    setSelectedEntry(entry)
  }

  const handleComplete = (entry) => {
    onEntryComplete(entry.id)
    setSelectedEntry(null)
  }

  return (
    <>
      <div className="calendar-grid-wrapper">
        <div className="calendar-grid calendar-weekdays">
          {weekdayLabels.map((label) => (
            <div key={label} className="weekday">
              {label}
            </div>
          ))}
        </div>
        <div className="calendar-grid calendar-days">
          {calendarDays.map((day) => {
            const dayItems = itemsByDate[day.iso] || []
            const visibleItems = dayItems.slice(0, 2)
            const hiddenItems = dayItems.slice(2)
            const isCompletedDay = dayItems.length > 0 && dayItems.every((entry) => entry.completed)
            const stampSrc = isCompletedDay ? '/tassei.png' : '/mitatsu.png'
            const stampAlt = isCompletedDay ? '達成' : '未達'

            return (
              <div
                key={day.iso}
                className={`calendar-cell ${day.isCurrentMonth ? '' : 'outside'} ${day.isToday ? 'today' : ''} ${
                  day.iso === focusDate ? 'target-date' : ''
                }`}
                ref={day.iso === focusDate ? focusCellRef : null}
              >
                <div className="calendar-cell-head">
                  <span className="calendar-date">{day.dayNumber}</span>
                  {dayItems.length > 0 && (
                    <img
                      src={stampSrc}
                      alt={stampAlt}
                      className={`calendar-count calendar-stamp ${animatedStampDates[day.iso] ? 'hanko-pop' : ''}`}
                    />
                  )}
                </div>
                <div className="calendar-events calendar-yokai-events">
                  {visibleItems.map((entry) => {
                    const yokai = getEntryYokai(entry)

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={`calendar-yokai-button ${entry.completed ? 'is-completed' : ''}`}
                        onClick={() => openEntryDetails(entry)}
                        title={`${yokai} / ${entry.productName}`}
                      >
                        <img src={`/${yokaiImageMap[yokai]}`} alt={yokai} className="calendar-yokai-icon" />
                      </button>
                    )
                  })}
                  {hiddenItems.length > 0 && (
                    <button
                      type="button"
                      className="calendar-more"
                      onClick={() => setOverflowEntries({ iso: day.iso, entries: hiddenItems })}
                    >
                      +{hiddenItems.length}件
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {overflowEntries && (
        <div className="calendar-modal-backdrop" onClick={() => setOverflowEntries(null)}>
          <div className="calendar-modal calendar-overflow-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="calendar-modal-close"
              onClick={() => setOverflowEntries(null)}
              aria-label="閉じる"
            >
              ×
            </button>
            <div className="calendar-modal-content">
              <p className="calendar-modal-kicker">{formatDisplayDate(overflowEntries.iso)}</p>
              <h3 className="calendar-modal-title">交換期限</h3>
              <div className="calendar-overflow-list">
                {overflowEntries.entries.map((entry) => {
                  const yokai = getEntryYokai(entry)

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className="calendar-overflow-item"
                      onClick={() => openEntryDetails(entry)}
                    >
                      <img src={`/${yokaiImageMap[yokai]}`} alt={yokai} className="calendar-overflow-icon" />
                      <div className="calendar-overflow-copy">
                        <strong>{yokai}</strong>
                        <span>{entry.productName}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
              <p className="calendar-modal-kicker">{getEntryYokai(selectedEntry)}</p>
              <h3 className="calendar-modal-title">{selectedEntry.productName}</h3>
              <p className="calendar-modal-meta">購入日: {formatDisplayDate(selectedEntry.purchaseDate)}</p>
              <p className="calendar-modal-meta">交換期限: {formatDisplayDate(selectedEntry.suggestedExpiration)}</p>
              <p className="calendar-modal-meta">カテゴリ: {selectedEntry.category}</p>
              {selectedEntry.reason && <p className="calendar-modal-reason">{selectedEntry.reason}</p>}
              {!selectedEntry.completed && (
                <button type="button" className="calendar-complete-button" onClick={() => handleComplete(selectedEntry)}>
                  交換済みにする
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CalendarGrid
