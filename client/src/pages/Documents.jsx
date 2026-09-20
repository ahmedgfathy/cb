import { useState, useEffect } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import Pagination from '../components/Pagination'

const emptyDoc = { name: '', type: 'contract', property_id: '', notes: '' }

export default function Documents() {
  const { t } = useI18n()
  const [docs, setDocs] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyDoc)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  function resetPage() { setPage(1) }

  useEffect(() => {
    Promise.all([api.getDocuments(), api.getProperties()])
      .then(([d, p]) => { setDocs(d); setProperties(p) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? docs : docs.filter(d => d.type === filter)

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  async function handleSave(e) {
    e.preventDefault()
    try {
      await api.createDocument({ ...form, property_id: form.property_id || null })
      setShowModal(false)
      setDocs(await api.getDocuments())
      setForm(emptyDoc)
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm(t('deleteContact'))) return
    try { await api.deleteDocument(id); setDocs(docs.filter(d => d.id !== id)) }
    catch (err) { alert(err.message) }
  }

  const typeIcon = (type) => {
    const icons = { contract: '📄', deed: '📜', invoice: '🧾', photo: '📷', other: '📁' }
    return icons[type] || '📁'
  }

  return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">folder_open</span> {t('documentsTitle')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); resetPage(); }}
            style={{
              height: '2rem', padding: '0 0.65rem',
              border: '1px solid #89919a', borderRadius: '0.25rem',
              fontSize: '0.8125rem', color: '#fff', background: 'rgba(255,255,255,0.15)',
            }}
          >
            <option value="all" style={{ color: '#32363a', background: '#fff' }}>{t('allTypes')}</option>
            <option value="contract" style={{ color: '#32363a', background: '#fff' }}>{t('contract')}s</option>
            <option value="deed" style={{ color: '#32363a', background: '#fff' }}>{t('deed')}s</option>
            <option value="invoice" style={{ color: '#32363a', background: '#fff' }}>{t('invoice')}s</option>
            <option value="photo" style={{ color: '#32363a', background: '#fff' }}>{t('photo')}s</option>
            <option value="other" style={{ color: '#32363a', background: '#fff' }}>{t('other')}</option>
          </select>
          <button className="btn-primary" onClick={() => { setForm(emptyDoc); setShowModal(true) }}>+ {t('addDocument')}</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-spinner">{t('loading')}</div>
         : filtered.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon"><span className="material-icons" style={{ fontSize: '48px' }}>folder_open</span></div>
              <p>{t('noDocuments')}</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('documentName')}</th>
                  <th>{t('documentType')}</th>
                  <th>{t('property')}</th>
                  <th>{t('notes')}</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span style={{ marginRight: '0.4rem' }}>{typeIcon(d.type)}</span>
                      <strong>{d.name}</strong>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{d.type}</td>
                    <td>{d.property_title || '—'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.notes || '—'}
                    </td>
                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="btn-delete" onClick={() => handleDelete(d.id)} title="Delete">🗑️</button>
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
              <h2>{t('addDocument')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('name')} <span className="required">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder={t('documentName')} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('documentType')}</label>
                    <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                      <option value="contract">{t('contract')}</option>
                      <option value="deed">{t('deed')}</option>
                      <option value="invoice">{t('invoice')}</option>
                      <option value="photo">{t('photo')}</option>
                      <option value="other">{t('other')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('property')}</label>
                    <select value={form.property_id} onChange={(e) => setForm({...form, property_id: e.target.value})}>
                      <option value="">— None —</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('notes')}</label>
                  <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3} placeholder={t('documentNotes')} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-default" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary">{t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
