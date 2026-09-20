import { useState, useEffect } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'

const emptyProperty = {
  property_number: '', area: '', unit_for_id: '', property_type_id: '',
  finish_type_id: '', building: '', total_price: '', space: '', unit_no: '',
  description: '', property_offered_by: '', name: '', mobile: '',
  last_followup: '', note_of_call: '', new_feedback: '',
  property_name_compound: '', handler_id: '', area_label: '',
  land_area: '', the_floors: '', category_id: '', inside_outside: '',
  sales: ''
}

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyProperty)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  function resetPage() { setPage(1) }

  const [propStatuses, setPropStatuses] = useState([])
  const [propTypes, setPropTypes] = useState([])
  const [finishTypes, setFinishTypes] = useState([])
  const [propCategories, setPropCategories] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [pData, ps, pt, ft, pc, emp] = await Promise.all([
        api.getProperties(),
        api.getLookup('property_statuses'),
        api.getLookup('property_types'),
        api.getLookup('finish_types'),
        api.getLookup('property_categories'),
        api.getEmployees(),
      ])
      setProperties(pData)
      setPropStatuses(ps)
      setPropTypes(pt)
      setFinishTypes(ft)
      setPropCategories(pc)
      setEmployees(emp)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = properties.filter((p) => {
    if (filter !== 'all' && p.unit_for !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (p.property_number || '').toLowerCase().includes(q)
        || (p.name || '').toLowerCase().includes(q)
        || (p.area || '').toLowerCase().includes(q)
        || (p.mobile || '').includes(q)
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  function formatPrice(n) {
    if (!n) return '—'
    return '$' + Number(n).toLocaleString()
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function statusColor(status) {
    const map = {
      'For sale': { bg: '#edf7ed', fg: '#1a7c42' },
      'For Rent': { bg: '#e8f0fe', fg: '#0a5cb8' },
      'Sold Out': { bg: '#f0f0f0', fg: '#6a6d70' },
      'Naw rented': { bg: '#fef6e6', fg: '#9c5600' },
      'Recycle': { bg: '#f3e8ff', fg: '#7c3aed' },
      'hold now': { bg: '#fde8e8', fg: '#bb1919' },
    }
    return map[status] || { bg: '#e8f0fe', fg: '#0a5cb8' }
  }

  function openDetail(p) { setSelected(p) }
  function openNew() { setEditing(null); setForm(emptyProperty); setShowModal(true) }
  function openEdit(p) {
    setEditing(p)
    setForm({
      property_number: p.property_number || '',
      area: p.area || '',
      unit_for_id: p.unit_for_id ? String(p.unit_for_id) : '',
      property_type_id: p.property_type_id ? String(p.property_type_id) : '',
      finish_type_id: p.finish_type_id ? String(p.finish_type_id) : '',
      building: p.building || '',
      total_price: p.total_price || '',
      space: p.space || '',
      unit_no: p.unit_no || '',
      description: p.description || '',
      property_offered_by: p.property_offered_by || '',
      name: p.name || '',
      mobile: p.mobile || '',
      last_followup: p.last_followup ? p.last_followup.split('T')[0] : '',
      note_of_call: p.note_of_call || '',
      new_feedback: p.new_feedback || '',
      property_name_compound: p.property_name_compound || '',
      handler_id: p.handler_id ? String(p.handler_id) : '',
      area_label: p.area_label || '',
      land_area: p.land_area || '',
      the_floors: p.the_floors || '',
      category_id: p.category_id ? String(p.category_id) : '',
      inside_outside: p.inside_outside || '',
      sales: p.sales || '',
    })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      ...form,
      unit_for_id: form.unit_for_id || null,
      property_type_id: form.property_type_id || null,
      finish_type_id: form.finish_type_id || null,
      handler_id: form.handler_id || null,
      category_id: form.category_id || null,
      total_price: form.total_price ? parseFloat(form.total_price) : 0,
      last_followup: form.last_followup || null,
    }
    try {
      if (editing) await api.updateProperty(editing.id, payload)
      else await api.createProperty(payload)
      setShowModal(false)
      await loadData()
    } catch (e) { alert(e.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this property?')) return
    try {
      await api.deleteProperty(id)
      setSelected(null)
      await loadData()
    } catch (e) { alert(e.message) }
  }

  // ─── DETAIL VIEW ───
  if (selected) {
    const sc = statusColor(selected.unit_for)
    return (
      <div>
        <div className="page-header">
          <h1><span className="material-icons">home</span> Property {selected.property_number}</h1>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Property Info */}
            <div className="sap-tile">
              <div className="section-title">
                <span className="material-icons" style={{ fontSize: '18px', color: '#0a6ed1' }}>home</span>
                Property Information
              </div>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>Property #</td><td style={{ padding: '0.35rem 0', fontWeight: 600, color: '#0a6ed1' }}>{selected.property_number}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Area</td><td style={{ padding: '0.35rem 0' }}>{selected.area || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Unit No</td><td style={{ padding: '0.35rem 0' }}>{selected.unit_no || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Building</td><td style={{ padding: '0.35rem 0' }}>{selected.building || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Compound</td><td style={{ padding: '0.35rem 0' }}>{selected.property_name_compound || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            {/* Status & Type */}
            <div className="sap-tile">
              <div className="section-title">
                <span className="material-icons" style={{ fontSize: '18px', color: '#e9730c' }}>info</span>
                Status & Classification
              </div>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>Unit For</td><td style={{ padding: '0.35rem 0' }}><span className="badge" style={{ background: sc.bg, color: sc.fg }}>{selected.unit_for || '—'}</span></td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Type</td><td style={{ padding: '0.35rem 0' }}><span className="badge badge-rented">{selected.property_type || '—'}</span></td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Finish</td><td style={{ padding: '0.35rem 0' }}><span className="badge badge-owner">{selected.finish_type || '—'}</span></td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Category</td><td style={{ padding: '0.35rem 0' }}>{selected.category || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Price</td><td style={{ padding: '0.35rem 0', fontWeight: 700, color: '#36b37e' }}>{formatPrice(selected.total_price)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Contact */}
            <div className="sap-tile">
              <div className="section-title">
                <span className="material-icons" style={{ fontSize: '18px', color: '#8a4cca' }}>person</span>
                Contact & Assignment
              </div>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70', width: '40%' }}>Name</td><td style={{ padding: '0.35rem 0', fontWeight: 600 }}>{selected.name || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Mobile</td><td style={{ padding: '0.35rem 0' }}>{selected.mobile || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Handler</td><td style={{ padding: '0.35rem 0', fontWeight: 600 }}>{selected.handler_name || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Sales</td><td style={{ padding: '0.35rem 0' }}>{selected.sales || '—'}</td></tr>
                  <tr><td style={{ padding: '0.35rem 0', color: '#6a6d70' }}>Last Follow-up</td><td style={{ padding: '0.35rem 0' }}>{formatDate(selected.last_followup)}</td></tr>
                </tbody>
              </table>
            </div>
            {/* Notes */}
            <div className="sap-tile">
              <div className="section-title">
                <span className="material-icons" style={{ fontSize: '18px', color: '#36b37e' }}>notes</span>
                Notes & Feedback
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6a6d70', marginBottom: '0.2rem', fontWeight: 600 }}>Description</div>
                <div style={{ fontSize: '0.875rem', padding: '0.5rem', background: '#f7f7f7', borderRadius: '0.375rem', minHeight: '3rem', whiteSpace: 'pre-wrap' }}>{selected.description || '—'}</div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6a6d70', marginBottom: '0.2rem', fontWeight: 600 }}>New Feedback</div>
                <div style={{ fontSize: '0.875rem', padding: '0.5rem', background: '#f7f7f7', borderRadius: '0.375rem', minHeight: '2rem', whiteSpace: 'pre-wrap' }}>{selected.new_feedback || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: '#6a6d70', marginBottom: '0.2rem', fontWeight: 600 }}>Note of Call</div>
                <div style={{ fontSize: '0.875rem', padding: '0.5rem', background: '#f7f7f7', borderRadius: '0.375rem', minHeight: '2rem', whiteSpace: 'pre-wrap' }}>{selected.note_of_call || '—'}</div>
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
        <h1><span className="material-icons">home</span> Properties</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="text" placeholder="Search #, name, area..." value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            style={{ height: '2rem', padding: '0 0.75rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#fff', background: 'rgba(255,255,255,0.12)', width: '13rem', outline: 'none' }} />
          <button className="btn-primary" onClick={openNew}>
            <span className="material-icons" style={{ fontSize: '18px' }}>add</span>
            Add Property
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid" style={{ marginBottom: '1rem' }}>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon blue" style={{ width: '2.25rem', height: '2.25rem' }}><span className="material-icons">home</span></div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.375rem' }}>{properties.length}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon green" style={{ width: '2.25rem', height: '2.25rem' }}><span className="material-icons">sell</span></div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.375rem' }}>{properties.filter(p => p.unit_for === 'For sale').length}</div>
              <div className="stat-label">For Sale</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon orange" style={{ width: '2.25rem', height: '2.25rem' }}><span className="material-icons">key</span></div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.375rem' }}>{properties.filter(p => p.unit_for === 'For Rent').length}</div>
              <div className="stat-label">For Rent</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="stat-icon purple" style={{ width: '2.25rem', height: '2.25rem' }}><span className="material-icons">check_circle</span></div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: '1.375rem' }}>{properties.filter(p => p.unit_for === 'Sold Out').length}</div>
              <div className="stat-label">Sold Out</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['all', 'For sale', 'For Rent', 'Naw rented', 'Sold Out', 'Recycle', 'hold now'].map(f => (
            <button key={f} className={`btn-sm ${filter === f ? 'btn-primary' : 'btn-default'}`}
              onClick={() => { setFilter(f); resetPage(); }} style={filter === f ? {} : { color: '#32363a' }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#6a6d70', alignSelf: 'center' }}>
            {filtered.length} of {properties.length} properties
          </span>
        </div>

        {loading ? <div className="loading-spinner">Loading...</div>
         : filtered.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon"><span className="material-icons" style={{ fontSize: '48px', color: '#d9d9d9' }}>home</span></div>
              <h3>No properties found</h3>
              <p>{search ? 'Try a different search' : 'Add a property or import from CSV.'}</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property #</th>
                  <th>Name</th>
                  <th>Area</th>
                  <th>Unit For</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Handler</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => {
                  const sc = statusColor(p.unit_for)
                  return (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(p)}>
                      <td><span style={{ fontWeight: 600, color: '#0a6ed1', fontSize: '0.8125rem' }}>{p.property_number}</span></td>
                      <td className="cell-strong">{p.name || p.property_name_compound || '—'}</td>
                      <td>{p.area || '—'}</td>
                      <td><span className="badge" style={{ background: sc.bg, color: sc.fg }}>{p.unit_for || '—'}</span></td>
                      <td><span className="badge badge-rented">{p.property_type || '—'}</span></td>
                      <td style={{ fontWeight: 600, color: '#36b37e' }}>{formatPrice(p.total_price)}</td>
                      <td>{p.handler_name || '—'}</td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-icon btn-icon-primary" onClick={() => openEdit(p)} title="Edit">
                          <span className="material-icons">edit</span>
                        </button>
                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(p.id)} title="Delete">
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
                <span className="material-icons" style={{ fontSize: '22px', color: '#0a6ed1' }}>home</span>
                {editing ? 'Edit Property' : 'New Property'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="section-title">Property Information</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Property Number</label>
                    <input value={form.property_number} onChange={(e) => setForm({...form, property_number: e.target.value})} placeholder="e.g. PRO5" />
                  </div>
                  <div className="form-group">
                    <label>Area</label>
                    <input value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} placeholder="e.g. Grand residence" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unit No</label>
                    <input value={form.unit_no} onChange={(e) => setForm({...form, unit_no: e.target.value})} placeholder="Unit number" />
                  </div>
                  <div className="form-group">
                    <label>Building</label>
                    <input value={form.building} onChange={(e) => setForm({...form, building: e.target.value})} placeholder="Building info" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Compound Name</label>
                  <input value={form.property_name_compound} onChange={(e) => setForm({...form, property_name_compound: e.target.value})} placeholder="Community / Compound name" />
                </div>

                <div className="section-title" style={{ marginTop: '0.5rem' }}>Status & Type</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unit For</label>
                    <select value={form.unit_for_id} onChange={(e) => setForm({...form, unit_for_id: e.target.value})}>
                      <option value="">— Select —</option>
                      {propStatuses.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Property Type</label>
                    <select value={form.property_type_id} onChange={(e) => setForm({...form, property_type_id: e.target.value})}>
                      <option value="">— Select —</option>
                      {propTypes.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Finish Type</label>
                    <select value={form.finish_type_id} onChange={(e) => setForm({...form, finish_type_id: e.target.value})}>
                      <option value="">— Select —</option>
                      {finishTypes.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category_id} onChange={(e) => setForm({...form, category_id: e.target.value})}>
                      <option value="">— Select —</option>
                      {propCategories.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Total Price</label>
                    <input type="number" value={form.total_price} onChange={(e) => setForm({...form, total_price: e.target.value})} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Space (m²)</label>
                    <input value={form.space} onChange={(e) => setForm({...form, space: e.target.value})} placeholder="e.g. 600m" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Inside / Outside Compound</label>
                    <input value={form.inside_outside} onChange={(e) => setForm({...form, inside_outside: e.target.value})} placeholder="Inside / Outside" />
                  </div>
                  <div className="form-group">
                    <label>The Floors</label>
                    <input value={form.the_floors} onChange={(e) => setForm({...form, the_floors: e.target.value})} placeholder="Floor info" />
                  </div>
                </div>

                <div className="section-title" style={{ marginTop: '0.5rem' }}>Contact & Assignment</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Client name" />
                  </div>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input type="tel" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} placeholder="Phone number" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Handler</label>
                    <select value={form.handler_id} onChange={(e) => setForm({...form, handler_id: e.target.value})}>
                      <option value="">— Unassigned —</option>
                      {employees.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sales</label>
                    <input value={form.sales} onChange={(e) => setForm({...form, sales: e.target.value})} placeholder="Sales person" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Property Offered By</label>
                    <input value={form.property_offered_by} onChange={(e) => setForm({...form, property_offered_by: e.target.value})} placeholder="Owner / Developer" />
                  </div>
                  <div className="form-group">
                    <label>Last Follow-up</label>
                    <input type="date" value={form.last_followup} onChange={(e) => setForm({...form, last_followup: e.target.value})} />
                  </div>
                </div>

                <div className="section-title" style={{ marginTop: '0.5rem' }}>Notes</div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} placeholder="Property description..." />
                </div>
                <div className="form-group">
                  <label>New Feedback</label>
                  <textarea value={form.new_feedback} onChange={(e) => setForm({...form, new_feedback: e.target.value})} rows={2} placeholder="Latest feedback..." />
                </div>
                <div className="form-group">
                  <label>Note of Call</label>
                  <textarea value={form.note_of_call} onChange={(e) => setForm({...form, note_of_call: e.target.value})} rows={2} placeholder="Call notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-default" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <span className="material-icons" style={{ fontSize: '18px' }}>save</span>
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
