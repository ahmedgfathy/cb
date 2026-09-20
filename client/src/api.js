const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('cb_token')
}

function setToken(token) {
  localStorage.setItem('cb_token', token)
}

function clearToken() {
  localStorage.removeItem('cb_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error('Unauthorized')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  login: (mobile, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ mobile, password }) }),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  dashboard: () => request('/dashboard'),

  // Super admin
  getCompanies: (status) => request(`/admin/companies${status ? `?status=${status}` : ''}`),
  approveCompany: (id, max_users) =>
    request(`/admin/companies/${id}/approve`, { method: 'PUT', body: JSON.stringify({ max_users }) }),
  rejectCompany: (id) =>
    request(`/admin/companies/${id}/reject`, { method: 'PUT' }),
  updateCompanyLimit: (id, max_users) =>
    request(`/admin/companies/${id}/limit`, { method: 'PUT', body: JSON.stringify({ max_users }) }),
  getAllUsers: () => request('/admin/users'),

  // Company admin
  getEmployees: (companyId) =>
    request(`/company/employees${companyId ? `?company_id=${companyId}` : ''}`),
  createEmployee: (data) =>
    request('/company/employees', { method: 'POST', body: JSON.stringify(data) }),
  deleteEmployee: (id, companyId) =>
    request(`/company/employees/${id}${companyId ? `?company_id=${companyId}` : ''}`, { method: 'DELETE' }),

  // CRM - Properties
  getProperties: () => request('/properties'),
  createProperty: (data) => request('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty: (id, data) => request(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProperty: (id) => request(`/properties/${id}`, { method: 'DELETE' }),

  // CRM - Contacts
  getContacts: () => request('/contacts'),
  createContact: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // CRM - Leads (new schema with FK lookups)
  getLeads: () => request('/leads'),
  createLead: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),

  // CRM - Opportunities
  getOpportunities: () => request('/opportunities'),
  createOpportunity: (data) => request('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  updateOpportunity: (id, data) => request(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOpportunity: (id) => request(`/opportunities/${id}`, { method: 'DELETE' }),

  // CRM - Documents
  getDocuments: () => request('/documents'),
  createDocument: (data) => request('/documents', { method: 'POST', body: JSON.stringify(data) }),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  // Lookup tables (company-scoped dropdowns)
  getLookup: (table) => request(`/lookups/${table}`),
  createLookup: (table, data) =>
    request(`/lookups/${table}`, { method: 'POST', body: JSON.stringify(data) }),
  updateLookup: (table, id, data) =>
    request(`/lookups/${table}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLookup: (table, id) =>
    request(`/lookups/${table}/${id}`, { method: 'DELETE' }),
}

export { getToken, setToken, clearToken }
