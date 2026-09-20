export default function PlaceholderPage({ icon, title, desc }) {
  return (
    <div>
      <div className="page-header">
        <h1>{icon} {title}</h1>
      </div>
      <div className="page-body">
        <div className="placeholder-page">
          <div className="ph-icon">{icon}</div>
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
      </div>
    </div>
  )
}
