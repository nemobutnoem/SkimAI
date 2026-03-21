export function Button({ children, variant = 'primary', ...props }) {
  const className = ['btn', `btn-${variant}`, props.className]
    .filter(Boolean)
    .join(' ')

  return (
    <button {...props} className={className}>
      {children}
    </button>
  )
}
