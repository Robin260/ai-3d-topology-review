import './ui.css'

function EmptyState({
  symbol = '◇',
  eyebrow,
  title,
  description,
  actions,
  note,
  compact = false,
  className = '',
}) {
  return (
    <section className={`ui-empty-state${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`}>
      <span className="ui-empty-state__symbol" aria-hidden="true">{symbol}</span>
      {eyebrow && <span className="ui-empty-state__eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
      {actions && <div className="ui-empty-state__actions">{actions}</div>}
      {note && <span className="ui-empty-state__note">{note}</span>}
    </section>
  )
}

export default EmptyState
