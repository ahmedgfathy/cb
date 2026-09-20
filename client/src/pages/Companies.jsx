import { useState, useEffect } from 'react'
import { api } from '../api'

const Icons = {
  check: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>,
  close: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>,
  edit: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 015 12.5V12h-.5a.5.5 0 01-.5-.5V11h-.5a.5.5 0 01-.468-.325z"/></svg>,
  building: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M14.763.075a.5.5 0 01.5.5c0 1.097-.346 2.104-.957 2.927-.611.818-1.465 1.486-2.413 1.885-.2.082-.354.144-.471.174a.5.5 0 01-.283 0 7.5 7.5 0 00-.956-.174c-.948-.399-1.802-1.067-2.413-1.885C1.346 3.104 1 2.097 1 1a.5.5 0 01.5-.5h13.263zM.5 3.5A.5.5 0 011 3h14a.5.5 0 010 1H1a.5.5 0 01-.5-.5zM1 6a.5.5 0 000 1h3.5v5.707a.5.5 0 00.854.354l1.5-1.5A.5.5 0 007 10.207V6H1zm6 0a.5.5 0 01.5-.5h7.5a.5.5 0 010 1H7.5A.5.5 0 017 6z"/></svg>,
  users: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6z"/><path fillRule="evenodd" d="M5.214 14A2.238 2.238 0 015 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 005 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/><path d="M4.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>,
  phone: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.654 1.328a.678.678 0 00-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 004.168 6.608 17.569 17.569 0 006.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 00-.063-1.015l-2.307-1.794a.678.678 0 00-.58-.122l-2.19.547a1.745 1.745 0 01-1.657-.459L5.482 8.062a1.745 1.745 0 01-.46-1.657l.548-2.19a.678.678 0 00-.122-.58L3.654 1.328z"/></svg>,
  clock: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.276.447l-2 1a.5.5 0 01-.448-.894L7.5 7.293V4a.5.5 0 01.5-.5z"/><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/></svg>,
}

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [maxUsers, setMaxUsers] = useState(5)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [filter])

  async function load() {
    try {
      const data = await api.getCompanies(filter === 'all' ? undefined : filter)
      setCompanies(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function updateLimit(id) {
    try {
      await api.updateCompanyLimit(id, maxUsers)
      setEditing(null)
      load()
    } catch (err) { alert(err.message) }
  }

  const statusConfig = {
    active: { label: 'Active', className: 'badge badge-available', icon: Icons.check },
    pending: { label: 'Pending', className: 'badge badge-pending', icon: Icons.clock },
    rejected: { label: 'Rejected', className: 'badge badge-lost', icon: Icons.close },
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          <svg className="header-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M14.763.075a.5.5 0 01.5.5c0 1.097-.346 2.104-.957 2.927-.611.818-1.465 1.486-2.413 1.885-.2.082-.354.144-.471.174a.5.5 0 01-.283 0 7.5 7.5 0 00-.956-.174c-.948-.399-1.802-1.067-2.413-1.885C1.346 3.104 1 2.097 1 1a.5.5 0 01.5-.5h13.263zM.5 3.5A.5.5 0 011 3h14a.5.5 0 010 1H1a.5.5 0 01-.5-.5zM1 6a.5.5 0 000 1h3.5v5.707a.5.5 0 00.854.354l1.5-1.5A.5.5 0 007 10.207V6H1zm6 0a.5.5 0 01.5-.5h7.5a.5.5 0 010 1H7.5A.5.5 0 017 6z"/></svg>
          Companies
        </h1>
        <div className="toolbar">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="page-body">
        {loading ? <div className="loading-spinner">Loading...</div>
         : companies.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon">{Icons.building}</div>
              <h3>No companies found</h3>
              <p>Companies will appear here once registered.</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Max Users</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => {
                  const sc = statusConfig[c.status] || statusConfig.pending
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '2rem', height: '2rem', borderRadius: '0.375rem',
                            background: c.status === 'active' ? '#edf7ed' : c.status === 'pending' ? '#fef6e6' : '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: c.status === 'active' ? '#1a7c42' : c.status === 'pending' ? '#9c5600' : '#6a6d70',
                            flexShrink: 0,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14.763.075a.5.5 0 01.5.5c0 1.097-.346 2.104-.957 2.927-.611.818-1.465 1.486-2.413 1.885-.2.082-.354.144-.471.174a.5.5 0 01-.283 0 7.5 7.5 0 00-.956-.174c-.948-.399-1.802-1.067-2.413-1.885C1.346 3.104 1 2.097 1 1a.5.5 0 01.5-.5h13.263zM.5 3.5A.5.5 0 011 3h14a.5.5 0 010 1H1a.5.5 0 01-.5-.5zM1 6a.5.5 0 000 1h3.5v5.707a.5.5 0 00.854.354l1.5-1.5A.5.5 0 007 10.207V6H1zm6 0a.5.5 0 01.5-.5h7.5a.5.5 0 010 1H7.5A.5.5 0 017 6z"/></svg>
                          </div>
                          <div>
                            <div className="cell-strong">{c.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#6a6d70' }}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3.654 1.328a.678.678 0 00-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 004.168 6.608 17.569 17.569 0 006.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 00-.063-1.015l-2.307-1.794a.678.678 0 00-.58-.122l-2.19.547a1.745 1.745 0 01-1.657-.459L5.482 8.062a1.745 1.745 0 01-.46-1.657l.548-2.19a.678.678 0 00-.122-.58L3.654 1.328z"/></svg>
                          {c.mobile}
                        </div>
                      </td>
                      <td>
                        <span className={sc.className}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{parseInt(c.user_count) || 0}</span>
                        <span className="cell-muted"> / {c.max_users}</span>
                      </td>
                      <td>
                        {editing === c.id ? (
                          <div className="inline-edit">
                            <input
                              type="number"
                              value={maxUsers}
                              onChange={(e) => setMaxUsers(parseInt(e.target.value) || 1)}
                              min="1"
                            />
                            <button className="btn-primary btn-sm" onClick={() => updateLimit(c.id)}>Save</button>
                            <button className="btn-default btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontWeight: 600 }}>{c.max_users}</span>
                            <button
                              className="btn-icon btn-icon-primary"
                              onClick={() => { setEditing(c.id); setMaxUsers(c.max_users) }}
                              title="Edit limit"
                            >
                              <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10z"/></svg>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="cell-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        {c.status === 'pending' && (
                          <span className="cell-muted" style={{ fontSize: '0.75rem' }}>See Pending Approvals</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
