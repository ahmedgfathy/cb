import { useState, useEffect } from 'react'
import { api } from '../api'

export default function AllUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try { setUsers(await api.getAllUsers()) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const roleConfig = {
    company_admin: { label: 'Company Admin', className: 'badge badge-buyer' },
    employee: { label: 'Employee', className: 'badge badge-available' },
  }

  const statusConfig = {
    active: { label: 'Active', className: 'badge badge-available' },
    pending: { label: 'Pending', className: 'badge badge-pending' },
    rejected: { label: 'Rejected', className: 'badge badge-lost' },
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          <svg className="header-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6z"/><path fillRule="evenodd" d="M5.214 14A2.238 2.238 0 015 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 005 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/><path d="M4.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>
          All Users
        </h1>
        <span className="cell-muted" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>
          {users.length} users
        </span>
      </div>
      <div className="page-body">
        {loading ? <div className="loading-spinner">Loading...</div>
         : users.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6z"/><path fillRule="evenodd" d="M5.214 14A2.238 2.238 0 015 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 005 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/><path d="M4.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>
              </div>
              <h3>No users yet</h3>
              <p>Users will appear once companies are approved and employees are added.</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const rc = roleConfig[u.role] || { label: u.role, className: 'badge' }
                  const sc = statusConfig[u.status] || { label: u.status, className: 'badge' }
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '2rem', height: '2rem', borderRadius: '50%',
                            background: u.role === 'company_admin' ? '#0a6ed1' : '#36b37e',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                          }}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="cell-strong">{u.name}</span>
                        </div>
                      </td>
                      <td>{u.mobile}</td>
                      <td><span className={rc.className}>{rc.label}</span></td>
                      <td>{u.company_name || '—'}</td>
                      <td><span className={sc.className}>{sc.label}</span></td>
                      <td className="cell-muted">{new Date(u.created_at).toLocaleDateString()}</td>
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
