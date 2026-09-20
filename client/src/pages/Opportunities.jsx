import { useState, useEffect } from 'react'
import { api } from '../api'

const emptyOpp = {
  name: '', contact_id: '', property_id: '', stage: 'prospect',
  amount: '', expected_close: '', probability: '', notes: ''
}

export default function Opportunities() {
  const [opps, setOpps] = useState([])
  const [contacts, setContacts] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyOpp)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([api.getOpportunities(), api.getContacts(), api.getProperties()])
      .then(([o, c, p]) => { setOpps(o); setContacts(c); setProperties(p) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? opps : opps.filter(o => o.stage === filter)

  function openNew() { setEditing(null); setForm(emptyOpp); setShowModal(true) }
  function openEdit(o) {
    setEditing(o.id)
    setForm({
      name: o.name, contact_id: o.contact_id || '', property_id: o.property_id || '',
      stage: o.stage, amount: o.amount || '', expected_close: o.expected_close ? o.expected_close.split('T')[0] : '',
      probability: o.probability || '', notes: o.notes
    })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      const data = {
        ...form,
        contact_id: form.contact_id || null,
        property_id: form.property_id || null,
        amount: form.amount || null,
        probability: form.probability || null,
        expected_close: form.expected_close || null,
      }
      if (editing) await api.updateOpportunity(editing, data)
      else await api.createOpportunity(data)
      setShowModal(false)
      setOpps(await api.getOpportunities())
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this opportunity?')) return
    try { await api.deleteOpportunity(id); setOpps(opps.filter(o => o.id !== id)) }
    catch (err) { alert(err.message) }
  }

  const totalValue = filtered.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1>💼 Opportunities</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              height: '2rem', padding: '0 0.65rem',
              border: '1px solid #89919a', borderRadius: '0.25rem',
              fontSize: '0.8125rem', color: '#fff', background: 'rgba(255,255,255,0.15)',
            }}
          >
            <option value="all" style={{ color: '#32363a', background: '#fff' }}>All Stages</option>
            <option value="prospect" style={{ color: '#32363a', background: '#fff' }}>Prospect</option>
            <option value="negotiation" style={{ color: '#32363a', background: '#fff' }}>Negotiation</option>
            <option value="proposal" style={{ color: '#32363a', background: '#fff' }}>Proposal</option>
            <option value="won" style={{ color: '#32363a', background: '#fff' }}>Won</option>
            <option value="lost" style={{ color: '#32363a', background: '#fff' }}>Lost</option>
          </select>
          <button className="btn-primary" onClick={openNew}>+ New Opportunity</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-spinner">Loading...</div>
         : filtered.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon">💼</div>
              <p>No opportunities found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="sap-tile" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', gap: '2rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#6a6d70' }}>
                <strong style={{ color: '#32363a' }}>{filtered.length}</strong> opportunities
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#6a6d70' }}>
                Total Value: <strong className="price">${totalValue.toLocaleString()}</strong>
              </span>
            </div>
            <div className="sap-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Property</th>
                    <th>Contact</th>
                    <th>Stage</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Prob.</th>
                    <th>Expected Close</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.name}</strong></td>
                      <td>{o.property_title || '—'}</td>
                      <td>{o.contact_name || '—'}</td>
                      <td><span className={`badge badge-${o.stage}`}>{o.stage}</span></td>
                      <td style={{ textAlign: 'right' }} className="price">
                        {o.amount ? `$${Number(o.amount).toLocaleString()}` : '—'}
                      </td>
                      <td>{o.probability ? `${o.probability}%` : '—'}</td>
                      <td>{o.expected_close ? new Date(o.expected_close).toLocaleDateString() : '—'}</td>
                      <td className="actions">
                        <button className="btn-edit" onClick={() => openEdit(o)} title="Edit">✏️</button>
                        <button className="btn-delete" onClick={() => handleDelete(o.id)} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Opportunity' : 'New Opportunity'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Opportunity name" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact</label>
                    <select value={form.contact_id} onChange={(e) => setForm({...form, contact_id: e.target.value})}>
                      <option value="">— None —</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Property</label>
                    <select value={form.property_id} onChange={(e) => setForm({...form, property_id: e.target.value})}>
                      <option value="">— None —</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.title} — ${Number(p.price).toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Stage</label>
                    <select value={form.stage} onChange={(e) => setForm({...form, stage: e.target.value})}>
                      <option value="prospect">Prospect</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="proposal">Proposal</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount ($)</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Probability (%)</label>
                    <input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({...form, probability: e.target.value})} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Expected Close Date</label>
                    <input type="date" value={form.expected_close} onChange={(e) => setForm({...form, expected_close: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3} placeholder="Notes..." />
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
