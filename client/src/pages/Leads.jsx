import { useState, useEffect } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import Pagination from '../components/Pagination'

const emptyLead = {
  salutation: '', last_name: '', mobile: '',
  call_status_id: '', client_status_id: '', unit_type_id: '',
  activity_type_id: '', assigned_to_id: '',
  last_followup: '', feedback: '', description: ''
}

export default function Leads() {
  const { t } = useI18n()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyLead)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  function resetPage() { setPage(1) }

  const [callStatuses, setCallStatuses] = useState([])
  const [clientStatuses, setClientStatuses] = useState([])
  const [unitTypes, setUnitTypes] = useState([])
  const [activityTypes, setActivityTypes] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [leadsData, cs, cls, ut, at, emp] = await Promise.all([
        api.getLeads(),
        api.getLookup('call_statuses'),
        api.getLookup('client_statuses'),
        api.getLookup('unit_types'),
        api.getLookup('activity_types'),
        api.getEmployees(),
      ])
      setLeads(leadsData)
      setCallStatuses(cs)
      setClientStatuses(cls)
      setUnitTypes(ut)
      setActivityTypes(at)
      setEmployees(emp)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = leads.filter((l) => {
    if (filter !== 'all' && l.client_status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (l.last_name || '').toLowerCase().includes(q)
        || (l.mobile || '').includes(q)
        || (l.lead_number || '').toLowerCase().includes(q)
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)

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

  function openDetail(l) { setSelected(l) }
  function openNew() { setEditing(null); setForm(emptyLead); setShowModal(true) }
  function openEdit(l) {
    setEditing(l)
    setForm({
      salutation: l.salutation || '',
      last_name: l.last_name || '',
      mobile: l.mobile || '',
      call_status_id: l.call_status_id ? String(l.call_status_id) : '',
      client_status_id: l.client_status_id ? String(l.client_status_id) : '',
      unit_type_id: l.unit_type_id ? String(l.unit_type_id) : '',
      activity_type_id: l.activity_type_id ? String(l.activity_type_id) : '',
      assigned_to_id: l.assigned_to_id ? String(l.assigned_to_id) : '',
      last_followup: l.last_followup ? l.last_followup.split('T')[0] : '',
      feedback: l.feedback || '',
      description: l.description || '',
    })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.last_name.trim()) return
    const payload = {
      ...form,
      call_status_id: form.call_status_id || null,
      client_status_id: form.client_status_id || null,
      unit_type_id: form.unit_type_id || null,
      activity_type_id: form.activity_type_id || null,
      assigned_to_id: form.assigned_to_id || null,
      last_followup: form.last_followup || null,
    }
    try {
      if (editing) {
        await api.updateLead(editing.id, payload)
      } else {
        await api.createLead(payload)
      }
      setShowModal(false)
      await loadData()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('deleteLead'))) return
    try {
      await api.deleteLead(id)
      setSelected(null)
      await loadData()
    } catch (e) {
      alert(e.message)
    }
  }

  // ─── DETAIL VIEW ───
  if (selected) {
    const sc = statusColor(selected.call_status)
    const csc = statusColor(selected.client_status)
    return (
      <div>
        <div className="page-header">
          <h1><span className="material-icons">description</span> {t('leadNumber')} {selected.lead_number}</h1>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-default" onClick={() => setSelected(null)}
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
              <span className="material-icons" style={{ fontSize: '18px' }}>arrow_back</span> {t('back')}
            </button>
            <button className="btn-primary" onClick={() => openEdit(selected)}>
              <span className="material-icons" style={{ fontSize: '18px' }}>edit</span> {t('edit')}
            </button>
            <button className="btn-primary btn-danger" onClick={() => handleDelete(selected.id)}>
              <span className="material-icons" style={{ fontSize: '18px' }}>delete</span> {t('delete')}
            </button>
          </div>
        </div>
        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="sap-tile">
              <div className="section-title">
                <span className="material-icons" style={{ fontSize: '18px', color: '#0a6ed1' }}>person</span>
                {t('clientInformation')}
              </div>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>{t('leadNumber')}</td><td style={{ padding: '0.35rem 0', fontWeight: 600, color: '#0a6ed1' }}>{selected.lead_number}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>{t('salutation')}</td><td style={{ padding: '0.35rem 0' }}>{selected.salutation || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>{t('lastName')}</td><td style={{ padding: '0.35rem 0', fontWeight: 600 }}>{selected.last_name}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>{t('mobile')}</td><td style={{ padding: '0.35rem 0' }}>{selected.mobile || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="sap-tile">
              <div className="section-title">
                <span className="material-icons" style={{ fontSize: '18px', color: '#e9730c' }}>info</span>
                {t('statusClassification')}
              </div>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>{t('callStatus')}</td>
                    <td style={{ padding: '0.35rem 0' }}><span className="badge" style={{ background: sc.bg, color: sc.fg }}>{selected.call_status || '—'}</span></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>{t('clientStatus')}</td>
                    <td style={{ padding: '0.35rem 0' }}><span className="badge" style={{ background: csc.bg, color: csc.fg }}>{selected.client_status || '—'}</span></td>
                  </tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>{t('unitTypeInterest')}</td><td style={{ padding: '0.35rem 0' }}><span className="badge badge-rented">{selected.unit_type || '—'}</span></td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>{t('activityType')}</td><td style={{ padding: '0.35rem 0' }}><span className="badge badge-owner">{selected.activity_type || '—'}</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="sap-tile">
              <div className="section-title">
                <span className="material-icons" style={{ fontSize: '18px', color: '#8a4cca' }}>group</span>
                {t('assignmentFollowup')}
              </div>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>{t('assignedTo')}</td><td style={{ padding: '0.35rem 0', fontWeight: 600 }}>{selected.assigned_to_name || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Last Follow-up</td><td style={{ padding: '0.35rem 0' }}>{formatDate(selected.last_followup)}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Created At</td><td style={{ padding: '0.35rem 0' }}>{formatDate(selected.created_at)}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Last Modified By</td><td style={{ padding: '0.35rem 0' }}>{selected.last_modified_by || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Updated At</td><td style={{ padding: '0.35rem 0' }}>{formatDate(selected.updated_at)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="sap-tile">
              <div className="section-title">
                <span className="material-icons" style={{ fontSize: '18px', color: '#36b37e' }}>notes</span>
                {t('notesFeedback')}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6a6d70', marginBottom: '0.2rem', fontWeight: 600 }}>{t('feedback')}</div>
                <div style={{ fontSize: '0.875rem', padding: '0.5rem', background: '#f7f7f7', borderRadius: '0.375rem', minHeight: '2.5rem', whiteSpace: 'pre-wrap' }}>
                  {selected.feedback || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: '#6a6d70', marginBottom: '0.2rem', fontWeight: 600 }}>{t('description')}</div>
                <div style={{ fontSize: '0.875rem', padding: '0.5rem', background: '#f7f7f7', borderRadius: '0.375rem', minHeight: '4rem', whiteSpace: 'pre-wrap' }}>
                  {selected.description || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── LIST VIEW ───
  return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">description</span> {t('leadsTitle')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="text" placeholder={t('searchLeads')} value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            style={{ height: '2rem', padding: '0 0.75rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#fff', background: 'rgba(255,255,255,0.12)', width: '13rem', outline: 'none' }} />
          <button className="btn-primary" onClick={openNew}>
            <span className="material-icons" style={{ fontSize: '18px' }}>add</span>
            {t('addLead')}
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid" style={{ marginBottom: '1rem' }}>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon blue" style={{ width: '2.25rem', height: '2.25rem' }}>
              <span className="material-icons">description</span>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.375rem' }}>{leads.length}</div>
              <div className="stat-label">{t('leads')}</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon green" style={{ width: '2.25rem', height: '2.25rem' }}>
              <span className="material-icons">check_circle</span>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.375rem' }}>{leads.filter(l => l.call_status === 'تم الرد').length}</div>
              <div className="stat-label">{t('answered')}</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon orange" style={{ width: '2.25rem', height: '2.25rem' }}>
              <span className="material-icons">call_missed</span>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.375rem' }}>{leads.filter(l => l.call_status === 'لا يرد').length}</div>
              <div className="stat-label">{t('noAnswer')}</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon purple" style={{ width: '2.25rem', height: '2.25rem' }}>
              <span className="material-icons">thumb_up</span>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.375rem' }}>{leads.filter(l => l.client_status === 'مهتم بالايجار').length}</div>
              <div className="stat-label">{t('interestedInRent')}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: t('all') },
            { value: 'مهتم بالايجار', label: t('interestedInRent') },
            { value: 'غير مهتم', label: t('notInterested') },
            { value: 'نفذ خارج الشركه', label: t('leftCompany') },
          ].map(f => (
            <button key={f.value} className={`btn-sm ${filter === f.value ? 'btn-primary' : 'btn-default'}`}
              onClick={() => { setFilter(f.value); resetPage(); }} style={filter === f.value ? {} : { color: '#32363a' }}>
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#6a6d70', alignSelf: 'center' }}>
            {filtered.length} of {leads.length} leads
          </span>
        </div>

        {loading ? <div className="loading-spinner">Loading...</div>
         : filtered.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon"><span className="material-icons" style={{ fontSize: '48px', color: '#d9d9d9' }}>description</span></div>
              <h3>{t('noLeadsFound')}</h3>
              <p>{search ? t('searchLeads') : t('importLeadsHint')}</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('leadNumber')}</th>
                  <th>{t('name')}</th>
                  <th>{t('mobile')}</th>
                  <th>{t('callStatus')}</th>
                  <th>{t('clientStatus')}</th>
                  <th>{t('unitTypeInterest')}</th>
                  <th>{t('activityType')}</th>
                  <th>{t('assignedTo')}</th>
                  <th>{t('followup')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((l) => {
                  const sc = statusColor(l.call_status)
                  const csc = statusColor(l.client_status)
                  return (
                    <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(l)}>
                      <td><span style={{ fontWeight: 600, color: '#0a6ed1', fontSize: '0.8125rem' }}>{l.lead_number}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: '#0a6ed1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.6875rem', flexShrink: 0 }}>
                            {l.last_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="cell-strong">{l.last_name}</div>
                            {l.salutation && <div className="cell-muted">{l.salutation}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{l.mobile || '—'}</td>
                      <td><span className="badge" style={{ background: sc.bg, color: sc.fg }}>{l.call_status || '—'}</span></td>
                      <td><span className="badge" style={{ background: csc.bg, color: csc.fg }}>{l.client_status || '—'}</span></td>
                      <td><span className="badge badge-rented">{l.unit_type || '—'}</span></td>
                      <td><span className="badge badge-owner" style={{ maxWidth: '7rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.activity_type || '—'}</span></td>
                      <td>{l.assigned_to_name || '—'}</td>
                      <td className="cell-muted">{l.last_followup ? formatDate(l.last_followup) : '—'}</td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-icon btn-icon-primary" onClick={() => openEdit(l)} title={t('edit')}>
                          <span className="material-icons">edit</span>
                        </button>
                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(l.id)} title={t('delete')}>
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination 
              total={filtered.length} 
              page={safePage} 
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            />
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '50rem' }}>
            <div className="modal-header">
              <h2>
                <span className="material-icons" style={{ fontSize: '22px', color: '#0a6ed1' }}>description</span>
                {editing ? t('editLead') : t('newLead')}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="section-title">{t('clientInformation')}</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('salutation')}</label>
                    <select value={form.salutation} onChange={(e) => setForm({...form, salutation: e.target.value})}>
                      <option value="">—</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('lastName')} <span className="required">*</span></label>
                    <input value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} placeholder={t('clientName')} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('mobileNumber')}</label>
                  <input type="tel" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} placeholder="Phone number" />
                </div>

                <div className="section-title" style={{ marginTop: '0.5rem' }}>{t('statusClassification')}</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('callStatus')}</label>
                    <select value={form.call_status_id} onChange={(e) => setForm({...form, call_status_id: e.target.value})}>
                      <option value="">— {t('select')} —</option>
                      {callStatuses.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('clientStatus')}</label>
                    <select value={form.client_status_id} onChange={(e) => setForm({...form, client_status_id: e.target.value})}>
                      <option value="">— {t('select')} —</option>
                      {clientStatuses.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('unitTypeInterest')}</label>
                    <select value={form.unit_type_id} onChange={(e) => setForm({...form, unit_type_id: e.target.value})}>
                      <option value="">— {t('select')} —</option>
                      {unitTypes.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('activityType')}</label>
                    <select value={form.activity_type_id} onChange={(e) => setForm({...form, activity_type_id: e.target.value})}>
                      <option value="">— {t('select')} —</option>
                      {activityTypes.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="section-title" style={{ marginTop: '0.5rem' }}>{t('assignmentFollowup')}</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('assignedTo')}</label>
                    <select value={form.assigned_to_id} onChange={(e) => setForm({...form, assigned_to_id: e.target.value})}>
                      <option value="">— {t('unassigned')} —</option>
                      {employees.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('followup')}</label>
                    <input type="date" value={form.last_followup} onChange={(e) => setForm({...form, last_followup: e.target.value})} />
                  </div>
                </div>

                <div className="section-title" style={{ marginTop: '0.5rem' }}>{t('notes')}</div>
                <div className="form-group">
                  <label>{t('feedback')}</label>
                  <textarea value={form.feedback} onChange={(e) => setForm({...form, feedback: e.target.value})} rows={2} placeholder="Call feedback..." />
                </div>
                <div className="form-group">
                  <label>{t('description')}</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} placeholder="Additional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-default" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary">
                  <span className="material-icons" style={{ fontSize: '18px' }}>save</span>
                  {editing ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
