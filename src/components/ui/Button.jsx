import './ui.css'

function Button({
  as: Element = 'button',
  variant = 'primary',
  size = 'medium',
  iconBefore = null,
  iconAfter = null,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const isDisabled = disabled || loading
  const elementProps = Element === 'button'
    ? { type: 'button', disabled: isDisabled, ...props }
    : { 'aria-disabled': isDisabled || undefined, ...props }

  return (
    <Element
      className={`ui-button ui-button--${variant} ui-button--${size}${className ? ` ${className}` : ''}`}
      {...elementProps}
    >
      {loading ? <span className="ui-button__spinner" aria-hidden="true" /> : iconBefore}
      <span>{children}</span>
      {!loading && iconAfter}
    </Element>
  )
}

export default Button
