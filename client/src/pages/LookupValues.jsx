import { useState, useEffect } from 'react'
import { api } from '../api'

const LOOKUP_CONFIG = [
  { key: 'call_statuses', label: 'Call Statuses', icon: '📞', desc: 'Values for call outcome (e.g., Answered, No Answer)' },
  { key: 'client_statuses', label: 'Client Statuses', icon: '👤', desc: 'Values for client interest level' },
  { key: 'unit_types', label: 'Unit Types', icon: '🏢', desc: 'Values for property unit types' },
  { key: 'activity_types', label: 'Activity Types', icon: '💼', desc: 'Values for business activity types' },
]

export default function LookupValues() {
  const [activeTab, setActiveTab] = useState('call_statuses')
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const data = {}
      for (const cfg of LOOKUP_CONFIG) {
        data[cfg.key] = await api.getLookup(cfg.key)
      }
      setItems(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await api.createLookup(activeTab, { name: newName.trim() })
      setNewName('')
      loadAll()
    } catch (err) { alert(err.message) }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    try {
      await api.updateLookup(activeTab, id, { name: editName.trim() })
      setEditingId(null)
      setEditName('')
      loadAll()
    } catch (err) { alert(err.message) }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await api.deleteLookup(activeTab, id)
      loadAll()
    } catch (err) { alert(err.message) }
  }

  const currentItems = items[activeTab] || []
  const currentConfig = LOOKUP_CONFIG.find(c => c.key === activeTab)

  return (
    <div>
      <div className="page-header">
        <h1>
          <svg className="header-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H4z"/></svg>
          Dropdown Values
        </h1>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>
          Manage leads dropdown options
        </span>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {LOOKUP_CONFIG.map(cfg => (
            <button
              key={cfg.key}
              className={`btn-sm ${activeTab === cfg.key ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setActiveTab(cfg.key)}
              style={activeTab === cfg.key ? {} : { color: '#32363a' }}
            >
              {cfg.label}
              {items[cfg.key] && (
                <span style={{
                  marginLeft: '0.3rem',
                  background: activeTab === cfg.key ? 'rgba(255,255,255,0.25)' : '#e8e8e8',
                  borderRadius: '0.75rem',
                  padding: '0 0.4rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}>
                  {items[cfg.key].length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="sap-tile">
          <div style={{ padding: '0.5rem 0 1rem', borderBottom: '1px solid #f0f0f0', marginBottom: '0.75rem' }}>
            <div className="section-title" style={{ border: 'none', margin: 0, padding: 0 }}>
              {currentConfig?.icon} {currentConfig?.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6a6d70' }}>{currentConfig?.desc}</div>
          </div>

          {/* Add new form */}
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Add new ${currentConfig?.label?.toLowerCase().replace(/s$/, '')}...`}
              style={{
                flex: 1, height: '2rem', padding: '0 0.65rem',
                border: '1px solid #d9d9d9', borderRadius: '0.375rem',
                fontSize: '0.8125rem',
              }}
            />
            <button type="submit" className="btn-primary btn-sm">
              <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/></svg>
              Add
            </button>
          </form>

          {loading ? <div className="loading-spinner">Loading...</div>
           : currentItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 0' }}>
              <h3>No values yet</h3>
              <p>Add the first value above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {currentItems.map((item) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                  border: '1px solid #f0f0f0', background: '#fafafa',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fafafa'}
                >
                  {editingId === item.id ? (
                    <div style={{ display: 'flex', gap: '0.3rem', flex: 1 }}>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(item.id); if (e.key === 'Escape') setEditingId(null) }}
                        autoFocus
                        style={{
                          flex: 1, height: '1.75rem', padding: '0 0.5rem',
                          border: '1px solid #0a6ed1', borderRadius: '0.25rem',
                          fontSize: '0.8125rem', outline: 'none',
                        }}
                      />
                      <button className="btn-primary btn-sm" onClick={() => handleUpdate(item.id)} style={{ height: '1.75rem' }}>
                        <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
                      </button>
                      <button className="btn-default btn-sm" onClick={() => setEditingId(null)} style={{ height: '1.75rem' }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{item.name}</span>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        <button className="btn-icon btn-icon-primary" onClick={() => { setEditingId(item.id); setEditName(item.name) }} title="Edit">
                          <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10z"/></svg>
                        </button>
                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(item.id, item.name)} title="Delete">
                          <svg className="icon-sm" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 010-2h3a1 1 0 011-1h3a1 1 0 011 1h3a1 1 0 011 1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3A.5.5 0 013 3h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
