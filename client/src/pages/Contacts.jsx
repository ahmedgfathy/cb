import { useState, useEffect } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'

const emptyContact = { name: '', email: '', phone: '', type: 'buyer', notes: '' }

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyContact)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  function resetPage() { setPage(1) }

  useEffect(() => { load() }, [])

  async function load() {
    try { setContacts(await api.getContacts()) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.type === filter)

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  function openNew() { setEditing(null); setForm(emptyContact); setShowModal(true) }
  function openEdit(c) {
    setEditing(c.id)
    setForm({ name: c.name, email: c.email, phone: c.phone, type: c.type, notes: c.notes })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      if (editing) await api.updateContact(editing, form)
      else await api.createContact(form)
      setShowModal(false)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this contact?')) return
    try { await api.deleteContact(id); load() }
    catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>👥 Contacts</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); resetPage(); }}
            style={{
              border: '1px solid #d9d9d9', borderRadius: '0.25rem',
              fontSize: '0.8125rem', color: '#32363a', background: '#fff'
            }}
          >
            <option value="all">All Types</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="tenant">Tenants</option>
            <option value="owner">Owners</option>
          </select>
          <button className="btn-primary" onClick={openNew}>+ Add Contact</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-spinner">Loading...</div>
         : filtered.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No contacts found</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.email || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td><span className={`badge badge-${c.type}`}>{c.type}</span></td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.notes || '—'}
                    </td>
                    <td className="actions">
                      <button className="btn-edit" onClick={() => openEdit(c)} title="Edit">✏️</button>
                      <button className="btn-delete" onClick={() => handleDelete(c.id)} title="Delete">🗑️</button>
                    </td>
                  </tr>
                ))}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Contact' : 'New Contact'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Full name" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+1 234 567 890" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="tenant">Tenant</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3} placeholder="Additional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-default" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
