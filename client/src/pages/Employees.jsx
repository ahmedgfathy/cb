import { useState, useEffect } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'

export default function Employees({ user }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', mobile: '', password: '' })
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  useEffect(() => { load() }, [])

  async function load() {
    try { setEmployees(await api.getEmployees(user.companyId)) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await api.createEmployee({ ...form, company_id: user.companyId })
      setShowModal(false)
      setForm({ name: '', mobile: '', password: '' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this employee?')) return
    try { await api.deleteEmployee(id, user.companyId); load() }
    catch (err) { alert(err.message) }
  }

  const totalPages = Math.max(1, Math.ceil(employees.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = employees.slice((safePage - 1) * perPage, safePage * perPage)

  return (
    <div>
      <div className="page-header">
        <h1><span className="material-icons">people</span> Employees</h1>
        <button className="btn-primary" onClick={() => { setForm({ name: '', mobile: '', password: '' }); setError(''); setShowModal(true) }}>
          <span className="material-icons" style={{ fontSize: '18px' }}>person_add</span>
          Add Employee
        </button>
      </div>
      <div className="page-body">
        {loading ? <div className="loading-spinner">Loading...</div>
         : employees.length === 0 ? (
          <div className="sap-tile">
            <div className="empty-state">
              <div className="empty-icon">
                <span className="material-icons" style={{ fontSize: '48px', color: '#d9d9d9' }}>people</span>
              </div>
              <h3>No employees yet</h3>
              <p>Add your first team member to get started.</p>
            </div>
          </div>
        ) : (
          <div className="sap-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                          background: '#36b37e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
                        }}>
                          {emp.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="cell-strong">{emp.name}</span>
                      </div>
                    </td>
                    <td>{emp.mobile}</td>
                    <td><span className="badge badge-available">Employee</span></td>
                    <td>
                      <span className={`badge ${emp.status === 'active' ? 'badge-available' : 'badge-pending'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="cell-muted">{new Date(emp.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(emp.id)} title="Remove employee">
                        <span className="material-icons">person_remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination 
              total={employees.length} 
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
              <h2>
                <span className="material-icons" style={{ fontSize: '22px', color: '#0a6ed1' }}>person_add</span>
                Add Employee
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            {error && (
              <div style={{ margin: '0 1.5rem' }}>
                <div className="sap-message sap-message-error">
                  <span className="material-icons">error</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Employee full name" required />
                </div>
                <div className="form-group">
                  <label>Mobile Number <span className="required">*</span></label>
                  <input type="tel" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} placeholder="Login mobile number" required />
                </div>
                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Set password (min 6 chars)" required minLength={6} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-default" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <span className="material-icons" style={{ fontSize: '18px' }}>check</span>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
