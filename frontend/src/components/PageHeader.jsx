import { yokaiImageMap } from '../constants/yokai'

function normalizeBadges(badge) {
  if (!badge) {
    return []
  }

  if (Array.isArray(badge.items)) {
    return badge.items
  }

  return [badge]
}

function PageHeader({ title, subtitle, badge }) {
  const badges = normalizeBadges(badge)

  return (
    <div>
      {badges.length > 0 && (
        <div className="header-badges" aria-hidden="true">
          {badges.filter(badgeItem => !badgeItem.label.includes("月次")).map((badgeItem, index) => {
            const isImageBadge = badgeItem.variant === 'image' && badgeItem.yokai

            return (
              <div
                key={`${badgeItem.label}-${badgeItem.yokai ?? 'text'}-${index}`}
                className={`yokai-badge ${badgeItem.variant === 'count' ? 'count-badge' : 'image-badge'} ${
                  badgeItem.variant === 'count' ? 'calendar-yokai' : ''
                }`}
                style={{ '--stamp-delay': `${index * 180}ms` }}
              >
                {isImageBadge && !badgeItem.label.includes("期限") ? (
                  <>
                    <img src={`/${yokaiImageMap[badgeItem.yokai]}`} alt={badgeItem.yokai} className="yokai-img" />
                    <span className="yokai-badge-label">{badgeItem.label}</span>
                  </>
                ) : !badgeItem.label.includes("期限") ? (
                  <span>{badgeItem.label}</span>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
      <div className={`header ${badges.some((item) => item.variant === 'count') ? 'calendar-header' : ''}`}>
        <div>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

export default PageHeader
