import { useState, useEffect } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'

export default function Dashboard({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">dashboard</span> Overview</h1>
      </div>
      <div className="page-body"><div className="loading-spinner">Loading dashboard...</div></div>
    </div>
  )

  if (error) return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">dashboard</span> Overview</h1>
      </div>
      <div className="page-body">
        <div className="sap-message sap-message-error">
          <span className="material-icons">error</span>
          <span>{error}</span>
        </div>
      </div>
    </div>
  )

  if (!data) return null
  const { stats, recentLeads, recentProperties } = data

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function statusColor(status) {
    const map = {
      'تم الرد': { bg: '#edf7ed', fg: '#1a7c42' },
      'لا يرد': { bg: '#fef6e6', fg: '#9c5600' },
      'مغلق': { bg: '#f0f0f0', fg: '#6a6d70' },
      'مهتم بالايجار': { bg: '#edf7ed', fg: '#1a7c42' },
      'غير مهتم': { bg: '#fde8e8', fg: '#bb1919' },
      'نفذ خارج الشركه': { bg: '#f0f0f0', fg: '#6a6d70' },
    }
    return map[status] || { bg: '#e8f0fe', fg: '#0a5cb8' }
  }

  return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">dashboard</span> Overview</h1>
      </div>

      <div className="page-body">
        {/* Primary Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><span className="material-icons">place</span></div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalProperties}</div>
              <div className="stat-label">Properties</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><span className="material-icons">payments</span></div>
            <div className="stat-info">
              <div className="stat-value">${stats.totalValue.toLocaleString()}</div>
              <div className="stat-label">Portfolio Value</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><span className="material-icons">description</span></div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalLeads}</div>
              <div className="stat-label">Total Leads</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><span className="material-icons">work</span></div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalOpportunities}</div>
              <div className="stat-label">Opportunities</div>
            </div>
          </div>
        </div>

        {/* Lead Performance */}
        {stats.totalLeads > 0 && (
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-icon green"><span className="material-icons">check_circle</span></div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalAnswered || 0}</div>
                <div className="stat-label">Calls Answered</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><span className="material-icons">call_missed</span></div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalLeads - (stats.totalAnswered || 0)}</div>
                <div className="stat-label">No Answer</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><span className="material-icons">thumb_up</span></div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalInterested || 0}</div>
                <div className="stat-label">Interested</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><span className="material-icons">group</span></div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalAgents || 0}</div>
                <div className="stat-label">Active Agents</div>
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Extra */}
        {stats.totalCompanies !== undefined && (
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-icon blue"><span className="material-icons">apartment</span></div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalCompanies}</div>
                <div className="stat-label">Companies</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><span className="material-icons">pending_actions</span></div>
              <div className="stat-info">
                <div className="stat-value">{stats.pendingApprovals}</div>
                <div className="stat-label">Pending Approvals</div>
              </div>
            </div>
          </div>
        )}

        {/* Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="sap-tile">
            <div className="section-title">
              <span className="material-icons" style={{ fontSize: '18px', color: '#0a6ed1' }}>description</span>
              Latest Leads
            </div>
            {recentLeads.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem 0' }}><h3>No leads yet</h3></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Lead #</th><th>Name</th><th>Call Status</th><th>Client Status</th></tr>
                </thead>
                <tbody>
                  {recentLeads.map((l) => {
                    const sc = statusColor(l.call_status)
                    const csc = statusColor(l.client_status)
                    return (
                      <tr key={l.id}>
                        <td><span style={{ fontWeight: 600, color: '#0a6ed1', fontSize: '0.8125rem' }}>{l.lead_number}</span></td>
                        <td className="cell-strong">{l.last_name}</td>
                        <td><span className="badge" style={{ background: sc.bg, color: sc.fg }}>{l.call_status || '—'}</span></td>
                        <td><span className="badge" style={{ background: csc.bg, color: csc.fg }}>{l.client_status || '—'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="sap-tile">
            <div className="section-title">
              <span className="material-icons" style={{ fontSize: '18px', color: '#36b37e' }}>home</span>
              Latest Properties
            </div>
            {recentProperties.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem 0' }}><h3>No properties yet</h3></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Property</th><th className="cell-right">Price</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentProperties.map((p) => (
                    <tr key={p.id}>
                      <td className="cell-strong">{p.title}</td>
                      <td className="cell-right" style={{ color: '#36b37e', fontWeight: 600 }}>${Number(p.price).toLocaleString()}</td>
                      <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
