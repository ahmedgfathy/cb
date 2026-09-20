import { useState, useEffect } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'
import { useI18n } from '../i18n'

export default function AllUsers() {
  const { t } = useI18n()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  useEffect(() => { load() }, [])

  async function load() {
    try { setUsers(await api.getAllUsers()) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const roleConfig = {
    company_admin: { label: t('companyAdmin'), className: 'badge badge-buyer' },
    employee: { label: t('employee'), className: 'badge badge-available' },
  }

  const statusConfig = {
    active: { label: t('active'), className: 'badge badge-available' },
    pending: { label: t('pending'), className: 'badge badge-pending' },
    rejected: { label: t('rejected'), className: 'badge badge-lost' },
  }

  const totalPages = Math.max(1, Math.ceil(users.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = users.slice((safePage - 1) * perPage, safePage * perPage)

  return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">people</span> {t('allUsersTitle')}</h1>
        <span className="cell-muted" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
          {users.length} {t('allUsers')}
        </span>
      </div>
      <div className="page-body">
        {loading ? <div className="loading-spinner">{t('loading')}</div>
         : users.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon">
                <span className="material-icons" style={{ fontSize: '48px', color: '#d9d9d9' }}>people</span>
              </div>
              <h3>{t('noUsers')}</h3>
              <p>{t('noUsersHint')}</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('user')}</th>
                  <th>{t('mobile')}</th>
                  <th>{t('employeeRole')}</th>
                  <th>{t('company')}</th>
                  <th>{t('status')}</th>
                  <th>{t('joined')}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => {
                  const rc = roleConfig[u.role] || { label: u.role, className: 'badge' }
                  const sc = statusConfig[u.status] || { label: u.status, className: 'badge' }
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                            background: u.role === 'company_admin' ? '#0a6ed1' : '#36b37e',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
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
            <Pagination 
              total={users.length} 
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
