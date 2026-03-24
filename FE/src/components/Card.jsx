export function Card({ title, children, className }) {
  return (
    <section className={['card', className].filter(Boolean).join(' ')}>
      {title ? <h3 className="card-title">{title}</h3> : null}
      <div className="card-body">{children}</div>
    </section>
  )
}
