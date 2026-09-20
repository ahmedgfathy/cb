import { useState, useEffect } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'
import { useI18n } from '../i18n'

export default function Companies() {
  const { t } = useI18n()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [maxUsers, setMaxUsers] = useState(5)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  function resetPage() { setPage(1) }

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
    active: { label: t('active'), className: 'badge badge-available', icon: 'check_circle' },
    pending: { label: t('pending'), className: 'badge badge-pending', icon: 'schedule' },
    rejected: { label: t('rejected'), className: 'badge badge-lost', icon: 'cancel' },
  }

  const totalPages = Math.max(1, Math.ceil(companies.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = companies.slice((safePage - 1) * perPage, safePage * perPage)

  return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">apartment</span> {t('companiesTitle')}</h1>
        <div className="toolbar">
          <select value={filter} onChange={(e) => { setFilter(e.target.value); resetPage(); }}>
            <option value="all">{t('allStatus')}</option>
            <option value="active">{t('active')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="rejected">{t('rejected')}</option>
          </select>
        </div>
      </div>
      <div className="page-body">
        {loading ? <div className="loading-spinner">{t('loading')}</div>
         : companies.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon"><span className="material-icons" style={{ fontSize: '48px', color: '#d9d9d9' }}>apartment</span></div>
              <h3>No companies found</h3>
              <p>Companies will appear here once registered.</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('company')}</th>
                  <th>{t('mobile')}</th>
                  <th>{t('status')}</th>
                  <th>{t('users')}</th>
                  <th>{t('maxUsers')}</th>
                  <th>{t('registered')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => {
                  const sc = statusConfig[c.status] || statusConfig.pending
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '2.25rem', height: '2.25rem', borderRadius: '0.375rem',
                            background: c.status === 'active' ? '#edf7ed' : c.status === 'pending' ? '#fef6e6' : '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: c.status === 'active' ? '#1a7c42' : c.status === 'pending' ? '#9c5600' : '#6a6d70',
                            flexShrink: 0,
                          }}>
                            <span className="material-icons">apartment</span>
                          </div>
                          <div>
                            <div className="cell-strong">{c.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#6a6d70' }}>
                          <span className="material-icons" style={{ fontSize: '16px' }}>phone</span>
                          {c.mobile}
                        </div>
                      </td>
                      <td>
                        <span className={sc.className}>
                          <span className="material-icons" style={{ fontSize: '14px' }}>{sc.icon}</span>
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
                            <button className="btn-primary btn-sm" onClick={() => updateLimit(c.id)}>{t('save')}</button>
                            <button className="btn-default btn-sm" onClick={() => setEditing(null)}>{t('cancel')}</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontWeight: 600 }}>{c.max_users}</span>
                            <button
                              className="btn-icon btn-icon-primary"
                              onClick={() => { setEditing(c.id); setMaxUsers(c.max_users) }}
                              title={t('editLimit')}
                            >
                              <span className="material-icons">edit</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="cell-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        {c.status === 'pending' && (
                          <span className="cell-muted" style={{ fontSize: '0.8125rem' }}>{t('pendingApproval')}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination 
              total={companies.length} 
              page={safePage} 
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
