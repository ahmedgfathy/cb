import './Sidebar.css'

export default function Sidebar({ page, setPage, user, onLogout }) {
  const isSuperAdmin = user?.role === 'super_admin'
  const isCompanyAdmin = user?.role === 'company_admin'

  const navSections = []

  if (isSuperAdmin) {
    navSections.push(
      { label: 'ADMINISTRATION', items: [
        { id: 'dashboard', icon: 'dashboard', label: 'Overview' },
        { id: 'pending', icon: 'pending_actions', label: 'Pending Approvals' },
        { id: 'companies', icon: 'apartment', label: 'Companies' },
        { id: 'all-users', icon: 'people', label: 'All Users' },
      ]},
      { label: 'CRM DATA', items: [
        { id: 'properties', icon: 'home', label: 'Properties' },
        { id: 'contacts', icon: 'contacts', label: 'Contacts' },
        { id: 'leads', icon: 'description', label: 'Leads' },
        { id: 'opportunities', icon: 'work', label: 'Opportunities' },
      ]},
    )
  } else if (isCompanyAdmin) {
    navSections.push(
      { label: 'COMPANY', items: [
        { id: 'dashboard', icon: 'dashboard', label: 'Overview' },
        { id: 'employees', icon: 'people', label: 'Employees' },
        { id: 'dropdown-values', icon: 'list', label: 'Dropdown Values' },
      ]},
      { label: 'SALES', items: [
        { id: 'leads', icon: 'description', label: 'Leads' },
        { id: 'opportunities', icon: 'work', label: 'Opportunities' },
        { id: 'contacts', icon: 'contacts', label: 'Contacts' },
      ]},
      { label: 'REAL ESTATE', items: [
        { id: 'properties', icon: 'home', label: 'Properties' },
        { id: 'documents', icon: 'folder_open', label: 'Documents' },
      ]},
    )
  } else {
    navSections.push(
      { label: 'SALES', items: [
        { id: 'leads', icon: 'description', label: 'Leads' },
        { id: 'contacts', icon: 'contacts', label: 'Contacts' },
      ]},
      { label: 'REAL ESTATE', items: [
        { id: 'properties', icon: 'home', label: 'Properties' },
      ]},
    )
  }

  return (
    <aside className="sap-sidebar">
      <div className="sap-shell-bar">
        <div className="sap-shell-left">
          <span className="material-icons" style={{ fontSize: '22px' }}>business</span>
          <span className="sap-shell-text">CB Real Estate</span>
        </div>
      </div>

      <nav className="sap-nav">
        {navSections.map((section) => (
          <div key={section.label} className="sap-nav-section">
            <span className="sap-nav-label">{section.label}</span>
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`sap-nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <span className="sap-nav-icon">
                  <span className="material-icons">{item.icon}</span>
                </span>
                <span className="sap-nav-text">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sap-nav-footer">
        <div className="sap-user">
          <div className="sap-user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sap-user-info">
            <span className="sap-user-name">{user?.name || 'User'}</span>
            <span className="sap-user-role">
              {isSuperAdmin ? 'Super Admin' : isCompanyAdmin ? 'Company Admin' : 'Employee'}
              {user?.companyName ? ` · ${user.companyName}` : ''}
            </span>
          </div>
        </div>
        <button className="sap-logout" onClick={onLogout} title="Sign Out">
          <span className="material-icons" style={{ fontSize: '20px' }}>logout</span>
        </button>
      </div>
    </aside>
  )
}
