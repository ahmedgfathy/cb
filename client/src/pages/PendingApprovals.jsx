import { useState, useEffect } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'
import { useI18n } from '../i18n'

export default function PendingApprovals() {
  const { t } = useI18n()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(null)
  const [maxUsers, setMaxUsers] = useState(5)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

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
    if (!confirm(t('rejectConfirm'))) return
    try { await api.rejectCompany(id); load() }
    catch (err) { alert(err.message) }
  }

  const totalPages = Math.max(1, Math.ceil(companies.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = companies.slice((safePage - 1) * perPage, safePage * perPage)

  return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">pending_actions</span> {t('pendingApprovalsTitle')}</h1>
        {companies.length > 0 && (
          <span className="badge badge-pending" style={{ fontSize: '0.875rem' }}>
            <span className="material-icons" style={{ fontSize: '14px' }}>schedule</span>
            {companies.length} {t('pending')}
          </span>
        )}
      </div>
      <div className="page-body">
        {loading ? <div className="loading-spinner">{t('loading')}</div>
         : companies.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon" style={{ background: '#edf7ed' }}>
                <span className="material-icons" style={{ fontSize: '32px', color: '#36b37e' }}>check_circle</span>
              </div>
              <h3>{t('allCaughtUp')}</h3>
              <p>{t('noPendingRegistrations')}</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('company')}</th>
                  <th>{t('contactMobile')}</th>
                  <th>{t('requested')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                          background: 'linear-gradient(135deg, #fef6e6, #fde8c2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#9c5600', flexShrink: 0,
                        }}>
                          <span className="material-icons">apartment</span>
                        </div>
                        <div>
                          <div className="cell-strong">{c.name}</div>
                          <div className="cell-muted">ID: {c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span className="material-icons" style={{ fontSize: '16px', color: '#6a6d70' }}>phone</span>
                        {c.mobile}
                      </div>
                    </td>
                    <td className="cell-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {approving === c.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#6a6d70', whiteSpace: 'nowrap' }}>{t('maxUsersLabel')}</span>
                          <input
                            type="number"
                            value={maxUsers}
                            onChange={(e) => setMaxUsers(parseInt(e.target.value) || 1)}
                            min="1"
                            style={{
                              width: '3.5rem', height: '1.875rem',
                              border: '1px solid #d9d9d9', borderRadius: '0.25rem',
                              padding: '0 0.4rem', fontSize: '0.875rem', textAlign: 'center',
                            }}
                          />
                          <button className="btn-primary btn-sm" style={{ background: '#36b37e' }} onClick={() => approve(c.id)}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>check</span>
                            {t('confirm')}
                          </button>
                          <button className="btn-default btn-sm" onClick={() => setApproving(null)}>{t('cancel')}</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <button className="btn-primary btn-sm" style={{ background: '#36b37e' }} onClick={() => setApproving(c.id)}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>check</span>
                            {t('approve')}
                          </button>
                          <button className="btn-icon btn-icon-danger" onClick={() => reject(c.id)} title={t('reject')}>
                            <span className="material-icons">close</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
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
