import { useState, useEffect } from 'react'
import { api } from '../api'

const emptyLead = {
  salutation: '', last_name: '', mobile: '',
  call_status_id: '', client_status_id: '', unit_type_id: '',
  activity_type_id: '', assigned_to_id: '',
  last_followup: '', feedback: '', description: ''
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyLead)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [callStatuses, setCallStatuses] = useState([])
  const [clientStatuses, setClientStatuses] = useState([])
  const [unitTypes, setUnitTypes] = useState([])
  const [activityTypes, setActivityTypes] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [l, cs, cls, ut, at, emp] = await Promise.all([
        api.getLeads(),
        api.getLookup('call_statuses'),
        api.getLookup('client_statuses'),
        api.getLookup('unit_types'),
        api.getLookup('activity_types'),
        api.getEmployees()
      ])
      setLeads(l)
      setCallStatuses(cs)
      setClientStatuses(cls)
      setUnitTypes(ut)
      setActivityTypes(at)
      setEmployees(emp)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = leads.filter(l => {
    if (filter !== 'all' && l.client_status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return (l.last_name || '').toLowerCase().includes(s) ||
        (l.mobile || '').includes(s) ||
        (l.lead_number || '').toLowerCase().includes(s) ||
        (l.activity_type || '').toLowerCase().includes(s) ||
        (l.assigned_to_name || '').toLowerCase().includes(s)
    }
    return true
  })

  function openNew() {
    setEditing(null)
    setForm(emptyLead)
    setShowModal(true)
  }

  function openEdit(l) {
    setEditing(l.id)
    setForm({
      salutation: l.salutation || '',
      last_name: l.last_name || '',
      mobile: l.mobile || '',
      call_status_id: l.call_status_id != null ? String(l.call_status_id) : '',
      client_status_id: l.client_status_id != null ? String(l.client_status_id) : '',
      unit_type_id: l.unit_type_id != null ? String(l.unit_type_id) : '',
      activity_type_id: l.activity_type_id != null ? String(l.activity_type_id) : '',
      assigned_to_id: l.assigned_to_id != null ? String(l.assigned_to_id) : '',
      last_followup: l.last_followup ? l.last_followup.split('T')[0] : '',
      feedback: l.feedback || '',
      description: l.description || '',
    })
    setShowModal(true)
  }

  function openDetail(l) {
    setSelected(l)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      const data = {
        ...form,
        call_status_id: form.call_status_id ? Number(form.call_status_id) : null,
        client_status_id: form.client_status_id ? Number(form.client_status_id) : null,
        unit_type_id: form.unit_type_id ? Number(form.unit_type_id) : null,
        activity_type_id: form.activity_type_id ? Number(form.activity_type_id) : null,
        assigned_to_id: form.assigned_to_id ? Number(form.assigned_to_id) : null,
        last_followup: form.last_followup || null,
      }
      if (editing) await api.updateLead(editing, data)
      else await api.createLead(data)
      setShowModal(false)
      loadData()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this lead?')) return
    try {
      await api.deleteLead(id)
      if (selected?.id === id) setSelected(null)
      loadData()
    } catch (err) { alert(err.message) }
  }

  function lookupName(list, id) {
    if (!id) return '—'
    const item = list.find(x => x.id === Number(id))
    return item ? item.name : '—'
  }

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

  // ─── DETAIL VIEW ───
  if (selected) {
    const sc = statusColor(selected.call_status)
    const csc = statusColor(selected.client_status)
    return (
      <div>
        <div className="page-header">
          <h1><span className="material-icons">description</span> Lead {selected.lead_number}</h1>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-default" onClick={() => setSelected(null)}
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
              <span className="material-icons" style={{ fontSize: '18px' }}>arrow_back</span> Back
            </button>
            <button className="btn-primary" onClick={() => openEdit(selected)}>
              <span className="material-icons" style={{ fontSize: '18px' }}>edit</span> Edit
            </button>
            <button className="btn-primary btn-danger" onClick={() => handleDelete(selected.id)}>
              <span className="material-icons" style={{ fontSize: '18px' }}>delete</span> Delete
            </button>
          </div>
        </div>
        <div className="page-body">
          {/* Top info bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Client Info */}
            <div className="sap-tile">
              <div className="section-title">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#0a6ed1"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6z"/><path fillRule="evenodd" d="M5.214 14A2.238 2.238 0 015 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 005 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/><path d="M4.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>
                Client Information
              </div>
              <table style={{ width: '100%', fontSize: '0.8125rem' }}>
                <tbody>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>Lead Number</td><td style={{ padding: '0.35rem 0', fontWeight: 600, color: '#0a6ed1' }}>{selected.lead_number}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Salutation</td><td style={{ padding: '0.35rem 0' }}>{selected.salutation || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Last Name</td><td style={{ padding: '0.35rem 0', fontWeight: 600 }}>{selected.last_name}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Mobile</td><td style={{ padding: '0.35rem 0' }}>{selected.mobile || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            {/* Status Info */}
            <div className="sap-tile">
              <div className="section-title">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#e9730c"><path d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.276.447l-2 1a.5.5 0 01-.448-.894L7.5 7.293V4a.5.5 0 01.5-.5z"/><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/></svg>
                Status & Classification
              </div>
              <table style={{ width: '100%', fontSize: '0.8125rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>Call Status</td>
                    <td style={{ padding: '0.35rem 0' }}><span className="badge" style={{ background: sc.bg, color: sc.fg }}>{selected.call_status || '—'}</span></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Client Status</td>
                    <td style={{ padding: '0.35rem 0' }}><span className="badge" style={{ background: csc.bg, color: csc.fg }}>{selected.client_status || '—'}</span></td>
                  </tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Unit Type</td><td style={{ padding: '0.35rem 0' }}><span className="badge badge-rented">{selected.unit_type || '—'}</span></td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Activity Type</td><td style={{ padding: '0.35rem 0' }}><span className="badge badge-owner">{selected.activity_type || '—'}</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Assignment & Follow-up */}
            <div className="sap-tile">
              <div className="section-title">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#8a4cca"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6z"/><path fillRule="evenodd" d="M5.214 14A2.238 2.238 0 015 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 005 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/></svg>
                Assignment & Follow-up
              </div>
              <table style={{ width: '100%', fontSize: '0.8125rem' }}>
                <tbody>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>Assigned To</td><td style={{ padding: '0.35rem 0', fontWeight: 600 }}>{selected.assigned_to_name || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Last Follow-up</td><td style={{ padding: '0.35rem 0' }}>{formatDate(selected.last_followup)}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Created At</td><td style={{ padding: '0.35rem 0' }}>{formatDate(selected.created_at)}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Last Modified By</td><td style={{ padding: '0.35rem 0' }}>{selected.last_modified_by || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Updated At</td><td style={{ padding: '0.35rem 0' }}>{formatDate(selected.updated_at)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div className="sap-tile">
              <div className="section-title">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#36b37e"><path d="M4 0h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2a2 2 0 012-2zm0 1a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H4z"/></svg>
                Notes & Feedback
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#6a6d70', marginBottom: '0.2rem', fontWeight: 600 }}>Feedback</div>
                <div style={{ fontSize: '0.8125rem', padding: '0.5rem', background: '#f7f7f7', borderRadius: '0.375rem', minHeight: '2.5rem', whiteSpace: 'pre-wrap' }}>
                  {selected.feedback || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6a6d70', marginBottom: '0.2rem', fontWeight: 600 }}>Description</div>
                <div style={{ fontSize: '0.8125rem', padding: '0.5rem', background: '#f7f7f7', borderRadius: '0.375rem', minHeight: '4rem', whiteSpace: 'pre-wrap' }}>
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
        <h1>
          <svg className="header-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H4z"/><path d="M9.5 3a.5.5 0 01.5.5v3H13a.5.5 0 010 1H10v3a.5.5 0 01-1 0v-3H6a.5.5 0 010-1h3.5v-3A.5.5 0 019.5 3z"/></svg>
          Leads
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="text" placeholder="Search name, mobile, lead#..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: '2rem', padding: '0 0.75rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.375rem', fontSize: '0.8125rem', color: '#fff', background: 'rgba(255,255,255,0.12)', width: '13rem', outline: 'none' }} />
          <button className="btn-primary" onClick={openNew}>
            <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/></svg>
            Add Lead
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '1rem' }}>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon blue" style={{ width: '2rem', height: '2rem' }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2z"/></svg>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{leads.length}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon green" style={{ width: '2rem', height: '2rem' }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{leads.filter(l => l.call_status === 'تم الرد').length}</div>
              <div className="stat-label">Answered</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon orange" style={{ width: '2rem', height: '2rem' }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.276.447l-2 1a.5.5 0 01-.448-.894L7.5 7.293V4a.5.5 0 01.5-.5z"/><path d="M8 16A8 8 0 108 0a8 8 0 000 16z"/></svg>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{leads.filter(l => l.call_status === 'لا يرد').length}</div>
              <div className="stat-label">No Answer</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon purple" style={{ width: '2rem', height: '2rem' }}>
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 10.781c.148 1.661 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4z"/></svg>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{leads.filter(l => l.client_status === 'مهتم بالايجار').length}</div>
              <div className="stat-label">Interested</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'مهتم بالايجار', label: 'Interested' },
            { value: 'غير مهتم', label: 'Not Interested' },
            { value: 'نفذ خارج الشركه', label: 'Left Company' },
          ].map(f => (
            <button key={f.value} className={`btn-sm ${filter === f.value ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setFilter(f.value)} style={filter === f.value ? {} : { color: '#32363a' }}>
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6a6d70', alignSelf: 'center' }}>
            {filtered.length} of {leads.length} leads
          </span>
        </div>

        {loading ? <div className="loading-spinner">Loading...</div>
         : filtered.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2z"/></svg></div>
              <h3>No leads found</h3>
              <p>{search ? 'Try a different search' : 'Import leads or create one.'}</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead #</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Call Status</th>
                  <th>Client Status</th>
                  <th>Unit Type</th>
                  <th>Activity</th>
                  <th>Assigned To</th>
                  <th>Follow-up</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const sc = statusColor(l.call_status)
                  const csc = statusColor(l.client_status)
                  return (
                    <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(l)}>
                      <td><span style={{ fontWeight: 600, color: '#0a6ed1', fontSize: '0.75rem' }}>{l.lead_number}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: '#0a6ed1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }}>
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
                        <button className="btn-icon btn-icon-primary" onClick={() => openEdit(l)} title="Edit">
                          <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10z"/></svg>
                        </button>
                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(l.id)} title="Delete">
                          <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 010-2h3a1 1 0 011-1h3a1 1 0 011 1h3a1 1 0 011 1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3A.5.5 0 013 3h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '50rem' }}>
            <div className="modal-header">
              <h2>
                <svg className="icon-lg" viewBox="0 0 16 16" fill="#0a6ed1"><path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H4z"/></svg>
                {editing ? 'Edit Lead' : 'New Lead'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* Client Info */}
                <div className="section-title">Client Information</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Salutation</label>
                    <select value={form.salutation} onChange={(e) => setForm({...form, salutation: e.target.value})}>
                      <option value="">—</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Last Name <span className="required">*</span></label>
                    <input value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} placeholder="Client name" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input type="tel" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} placeholder="Phone number" />
                </div>

                {/* Status */}
                <div className="section-title" style={{ marginTop: '0.5rem' }}>Status & Classification</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Call Status</label>
                    <select value={form.call_status_id} onChange={(e) => setForm({...form, call_status_id: e.target.value})}>
                      <option value="">— Select —</option>
                      {callStatuses.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Client Status</label>
                    <select value={form.client_status_id} onChange={(e) => setForm({...form, client_status_id: e.target.value})}>
                      <option value="">— Select —</option>
                      {clientStatuses.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unit Type Interest</label>
                    <select value={form.unit_type_id} onChange={(e) => setForm({...form, unit_type_id: e.target.value})}>
                      <option value="">— Select —</option>
                      {unitTypes.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Activity Type</label>
                    <select value={form.activity_type_id} onChange={(e) => setForm({...form, activity_type_id: e.target.value})}>
                      <option value="">— Select —</option>
                      {activityTypes.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Assignment */}
                <div className="section-title" style={{ marginTop: '0.5rem' }}>Assignment & Follow-up</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Assigned To</label>
                    <select value={form.assigned_to_id} onChange={(e) => setForm({...form, assigned_to_id: e.target.value})}>
                      <option value="">— Unassigned —</option>
                      {employees.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Last Follow-up</label>
                    <input type="date" value={form.last_followup} onChange={(e) => setForm({...form, last_followup: e.target.value})} />
                  </div>
                </div>

                {/* Notes */}
                <div className="section-title" style={{ marginTop: '0.5rem' }}>Notes</div>
                <div className="form-group">
                  <label>Feedback</label>
                  <textarea value={form.feedback} onChange={(e) => setForm({...form, feedback: e.target.value})} rows={2} placeholder="Call feedback..." />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} placeholder="Additional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-default" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
