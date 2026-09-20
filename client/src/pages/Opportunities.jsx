import { useState, useEffect } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import Pagination from '../components/Pagination'

const emptyOpp = {
  name: '', contact_id: '', property_id: '', stage: 'prospect',
  amount: '', expected_close: '', probability: '', notes: ''
}

export default function Opportunities() {
  const { t } = useI18n()
  const [opps, setOpps] = useState([])
  const [contacts, setContacts] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyOpp)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  function resetPage() { setPage(1) }

  useEffect(() => {
    Promise.all([api.getOpportunities(), api.getContacts(), api.getProperties()])
      .then(([o, c, p]) => { setOpps(o); setContacts(c); setProperties(p) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? opps : opps.filter(o => o.stage === filter)

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)

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
    if (!confirm(t('deleteOpportunity'))) return
    try { await api.deleteOpportunity(id); setOpps(opps.filter(o => o.id !== id)) }
    catch (err) { alert(err.message) }
  }

  const totalValue = filtered.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">work</span> {t('opportunitiesTitle')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); resetPage(); }}
            style={{
              border: '1px solid #89919a', borderRadius: '0.25rem',
              fontSize: '0.8125rem', color: '#fff', background: 'rgba(255,255,255,0.15)',
            }}
          >
            <option value="all" style={{ color: '#32363a', background: '#fff' }}>{t('allStages')}</option>
            <option value="prospect" style={{ color: '#32363a', background: '#fff' }}>{t('prospect')}</option>
            <option value="negotiation" style={{ color: '#32363a', background: '#fff' }}>{t('negotiation')}</option>
            <option value="proposal" style={{ color: '#32363a', background: '#fff' }}>{t('proposal')}</option>
            <option value="won" style={{ color: '#32363a', background: '#fff' }}>{t('won')}</option>
            <option value="lost" style={{ color: '#32363a', background: '#fff' }}>{t('lost')}</option>
          </select>
          <button className="btn-primary" onClick={openNew}>+ {t('addOpportunity')}</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-spinner">{t('loading')}</div>
         : filtered.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon"><span className="material-icons" style={{ fontSize: '48px' }}>work</span></div>
              <p>{t('noOpportunities')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="sap-tile" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', gap: '2rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#6a6d70' }}>
                <strong style={{ color: '#32363a' }}>{filtered.length}</strong> {t('opportunitiesCount')}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#6a6d70' }}>
                {t('totalValue')}: <strong className="price">${totalValue.toLocaleString()}</strong>
              </span>
            </div>
            <div className="sap-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('opportunityName')}</th>
                    <th>{t('property')}</th>
                    <th>{t('contact')}</th>
                    <th>{t('stage')}</th>
                    <th style={{ textAlign: 'right' }}>{t('amount')}</th>
                    <th>{t('probability')}</th>
                    <th>{t('expectedCloseDate')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((o) => (
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
              <Pagination 
                total={filtered.length} 
                page={safePage} 
                perPage={perPage}
                onPageChange={setPage}
                onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
              />
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? t('editOpportunity') : t('newOpportunity')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('name')} <span className="required">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder={t('opportunityName')} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('contact')}</label>
                    <select value={form.contact_id} onChange={(e) => setForm({...form, contact_id: e.target.value})}>
                      <option value="">— None —</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('property')}</label>
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
                    <label>{t('stage')}</label>
                    <select value={form.stage} onChange={(e) => setForm({...form, stage: e.target.value})}>
                      <option value="prospect">{t('prospect')}</option>
                      <option value="negotiation">{t('negotiation')}</option>
                      <option value="proposal">{t('proposal')}</option>
                      <option value="won">{t('won')}</option>
                      <option value="lost">{t('lost')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('amount')}</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('probability')}</label>
                    <input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({...form, probability: e.target.value})} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>{t('expectedCloseDate')}</label>
                    <input type="date" value={form.expected_close} onChange={(e) => setForm({...form, expected_close: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('notes')}</label>
                  <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3} placeholder="Notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-default" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary">{editing ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
