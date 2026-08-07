import './ui.css'

function ErrorNotice({
  title = '出现问题',
  message,
  guidance,
  action,
  compact = false,
  className = '',
}) {
  return (
    <div className={`ui-error-notice${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`} role="alert">
      <span className="ui-error-notice__icon" aria-hidden="true">!</span>
      <div>
        <strong>{title}</strong>
        {message && <p>{message}</p>}
        {guidance && <small>{guidance}</small>}
        {action && <div className="ui-error-notice__action">{action}</div>}
      </div>
    </div>
  )
}

export default ErrorNotice
