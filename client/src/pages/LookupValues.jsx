import { useState, useEffect } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'

const LOOKUP_CONFIG = [
  { key: 'call_statuses', labelKey: 'callStatuses', icon: 'phone', desc: 'Values for call outcome (e.g., Answered, No Answer)' },
  { key: 'client_statuses', labelKey: 'clientStatuses', icon: 'person', desc: 'Values for client interest level' },
  { key: 'unit_types', labelKey: 'unitTypes', icon: 'apartment', desc: 'Values for property unit types' },
  { key: 'activity_types', labelKey: 'activityTypes', icon: 'work', desc: 'Values for business activity types' },
]

export default function LookupValues() {
  const { t } = useI18n()
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
        <h1><span className="material-icons">list</span> {t('lookupValuesTitle')}</h1>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
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
              <span className="material-icons" style={{ fontSize: '16px' }}>{cfg.icon}</span>
              {t(cfg.labelKey)}
              {items[cfg.key] && (
                <span style={{
                  marginLeft: '0.3rem',
                  background: activeTab === cfg.key ? 'rgba(255,255,255,0.25)' : '#e8e8e8',
                  borderRadius: '0.75rem',
                  padding: '0 0.4rem',
                  fontSize: '0.6875rem',
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
              <span className="material-icons" style={{ fontSize: '18px', color: '#0a6ed1' }}>{currentConfig?.icon}</span>
              {currentConfig ? t(currentConfig.labelKey) : ''}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#6a6d70' }}>{currentConfig?.desc}</div>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('addNewValue')}
              style={{
                flex: 1, height: '2.25rem', padding: '0 0.75rem',
                border: '1px solid #d9d9d9', borderRadius: '0.375rem',
                fontSize: '0.875rem',
              }}
            />
            <button type="submit" className="btn-primary btn-sm">
              <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
              {t('addValue')}
            </button>
          </form>

          {loading ? <div className="loading-spinner">{t('loading')}</div>
           : currentItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 0' }}>
              <h3>{t('noValues')}</h3>
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
                          flex: 1, height: '1.875rem', padding: '0 0.5rem',
                          border: '1px solid #0a6ed1', borderRadius: '0.25rem',
                          fontSize: '0.875rem', outline: 'none',
                        }}
                      />
                      <button className="btn-primary btn-sm" onClick={() => handleUpdate(item.id)} style={{ height: '1.875rem' }}>
                        <span className="material-icons" style={{ fontSize: '16px' }}>check</span>
                      </button>
                      <button className="btn-default btn-sm" onClick={() => setEditingId(null)} style={{ height: '1.875rem' }}>{t('cancel')}</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</span>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        <button className="btn-icon btn-icon-primary" onClick={() => { setEditingId(item.id); setEditName(item.name) }} title="Edit">
                          <span className="material-icons">edit</span>
                        </button>
                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(item.id, item.name)} title="Delete">
                          <span className="material-icons">delete</span>
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
