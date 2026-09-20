import { useState, useEffect } from 'react'
import { api } from '../api'

export default function PendingApprovals() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(null)
  const [maxUsers, setMaxUsers] = useState(5)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await api.getCompanies('pending')
      setCompanies(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function approve(id) {
    try {
      await api.approveCompany(id, maxUsers)
      setApproving(null)
      setMaxUsers(5)
      load()
    } catch (err) { alert(err.message) }
  }

  async function reject(id) {
    if (!confirm('Reject this company registration?')) return
    try { await api.rejectCompany(id); load() }
    catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          <svg className="header-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.276.447l-2 1a.5.5 0 01-.448-.894L7.5 7.293V4a.5.5 0 01.5-.5z"/><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/></svg>
          Pending Approvals
        </h1>
        {companies.length > 0 && (
          <span className="badge badge-pending" style={{ fontSize: '0.8125rem' }}>
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.276.447l-2 1a.5.5 0 01-.448-.894L7.5 7.293V4a.5.5 0 01.5-.5z"/><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/></svg>
            {companies.length} pending
          </span>
        )}
      </div>
      <div className="page-body">
        {loading ? <div className="loading-spinner">Loading...</div>
         : companies.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon" style={{ background: '#edf7ed' }}>
                <svg viewBox="0 0 16 16" fill="#36b37e" style={{ width: '1.5rem', height: '1.5rem' }}><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
              </div>
              <h3>All caught up!</h3>
              <p>No pending registrations to review.</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact Mobile</th>
                  <th>Requested</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                          background: 'linear-gradient(135deg, #fef6e6, #fde8c2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#9c5600', flexShrink: 0,
                        }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14.763.075a.5.5 0 01.5.5c0 1.097-.346 2.104-.957 2.927-.611.818-1.465 1.486-2.413 1.885-.2.082-.354.144-.471.174a.5.5 0 01-.283 0 7.5 7.5 0 00-.956-.174c-.948-.399-1.802-1.067-2.413-1.885C1.346 3.104 1 2.097 1 1a.5.5 0 01.5-.5h13.263zM.5 3.5A.5.5 0 011 3h14a.5.5 0 010 1H1a.5.5 0 01-.5-.5zM1 6a.5.5 0 000 1h3.5v5.707a.5.5 0 00.854.354l1.5-1.5A.5.5 0 007 10.207V6H1zm6 0a.5.5 0 01.5-.5h7.5a.5.5 0 010 1H7.5A.5.5 0 017 6z"/></svg>
                        </div>
                        <div>
                          <div className="cell-strong">{c.name}</div>
                          <div className="cell-muted">ID: {c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="#6a6d70"><path d="M3.654 1.328a.678.678 0 00-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 004.168 6.608 17.569 17.569 0 006.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 00-.063-1.015l-2.307-1.794a.678.678 0 00-.58-.122l-2.19.547a1.745 1.745 0 01-1.657-.459L5.482 8.062a1.745 1.745 0 01-.46-1.657l.548-2.19a.678.678 0 00-.122-.58L3.654 1.328z"/></svg>
                        {c.mobile}
                      </div>
                    </td>
                    <td className="cell-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {approving === c.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6a6d70', whiteSpace: 'nowrap' }}>Max users:</span>
                          <input
                            type="number"
                            value={maxUsers}
                            onChange={(e) => setMaxUsers(parseInt(e.target.value) || 1)}
                            min="1"
                            style={{
                              width: '3.5rem', height: '1.875rem',
                              border: '1px solid #d9d9d9', borderRadius: '0.25rem',
                              padding: '0 0.4rem', fontSize: '0.8125rem', textAlign: 'center',
                            }}
                          />
                          <button className="btn-primary btn-sm" style={{ background: '#36b37e' }} onClick={() => approve(c.id)}>
                            <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
                            Confirm
                          </button>
                          <button className="btn-default btn-sm" onClick={() => setApproving(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <button className="btn-primary btn-sm" style={{ background: '#36b37e' }} onClick={() => setApproving(c.id)}>
                            <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
                            Approve
                          </button>
                          <button className="btn-icon btn-icon-danger" onClick={() => reject(c.id)} title="Reject">
                            <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
