import { useState, useEffect } from 'react'
import { api } from '../api'

const emptyProperty = {
  title: '', address: '', city: '', state: '', price: '',
  type: 'house', bedrooms: 0, bathrooms: 0, sqft: 0,
  status: 'available', description: ''
}

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyProperty)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    try { setProperties(await api.getProperties()) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = filter === 'all' ? properties : properties.filter(p => p.status === filter)

  function openNew() { setEditing(null); setForm(emptyProperty); setShowModal(true) }
  function openEdit(p) {
    setEditing(p.id)
    setForm({
      title: p.title, address: p.address, city: p.city, state: p.state,
      price: p.price, type: p.type, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
      sqft: p.sqft, status: p.status, description: p.description
    })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      if (editing) await api.updateProperty(editing, form)
      else await api.createProperty(form)
      setShowModal(false)
      load()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this property?')) return
    try { await api.deleteProperty(id); load() }
    catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>🏠 Properties</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              height: '2.25rem', padding: '0 0.75rem',
              border: '1px solid #d9d9d9', borderRadius: '0.25rem',
              fontSize: '0.8125rem', color: '#32363a', background: '#fff'
            }}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>
          <button className="btn-primary" onClick={openNew}>+ Add Property</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-spinner">Loading...</div>
         : filtered.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <p>No properties found</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th>Type</th>
                  <th>Beds / Baths</th>
                  <th>Sq Ft</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.title}</strong></td>
                    <td>{p.city}{p.state ? `, ${p.state}` : ''}</td>
                    <td style={{ textAlign: 'right' }} className="price">
                      ${Number(p.price).toLocaleString()}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{p.type}</td>
                    <td>{p.bedrooms} / {p.bathrooms}</td>
                    <td>{Number(p.sqft).toLocaleString()}</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    <td className="actions">
                      <button className="btn-edit" onClick={() => openEdit(p)} title="Edit">✏️</button>
                      <button className="btn-delete" onClick={() => handleDelete(p.id)} title="Delete">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Property' : 'New Property'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title <span className="required">*</span></label>
                  <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="e.g. Modern Apartment" required />
                </div>
                <div className="form-group">
                  <label>Address <span className="required">*</span></label>
                  <input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="123 Main Street" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City <span className="required">*</span></label>
                    <input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} placeholder="New York" required />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} placeholder="NY" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price ($) <span className="required">*</span></label>
                    <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="0" required />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bedrooms</label>
                    <input type="number" value={form.bedrooms} onChange={(e) => setForm({...form, bedrooms: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms</label>
                    <input type="number" value={form.bathrooms} onChange={(e) => setForm({...form, bathrooms: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Square Feet</label>
                    <input type="number" value={form.sqft} onChange={(e) => setForm({...form, sqft: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                      <option value="available">Available</option>
                      <option value="pending">Pending</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} placeholder="Property description..." />
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
