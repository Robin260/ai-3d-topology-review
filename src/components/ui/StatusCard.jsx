import './ui.css'

const statusIcons = {
  success: '✓',
  warning: '!',
  error: '×',
  info: 'i',
  neutral: '—',
}

function StatusCard({
  tone = 'neutral',
  label,
  title,
  description,
  meta,
  compact = false,
  className = '',
}) {
  return (
    <div
      className={`ui-status-card ui-status-card--${tone}${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`}
      role="status"
    >
      <span className="ui-status-card__icon" aria-hidden="true">{statusIcons[tone] || statusIcons.neutral}</span>
      <div className="ui-status-card__content">
        {label && <span className="ui-status-card__label">{label}</span>}
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {meta && <small>{meta}</small>}
    </div>
  )
}

export default StatusCard
