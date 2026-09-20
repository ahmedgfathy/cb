import { useI18n } from '../i18n'
import './Sidebar.css'

export default function Sidebar({ page, setPage, user, onLogout }) {
  const { lang, setLang, t } = useI18n()
  const isSuperAdmin = user?.role === 'super_admin'
  const isCompanyAdmin = user?.role === 'company_admin'

  const navSections = []

  if (isSuperAdmin) {
    navSections.push(
      { label: t('dashboard').toUpperCase(), items: [
        { id: 'dashboard', icon: 'dashboard', label: t('dashboard') },
        { id: 'pending', icon: 'pending_actions', label: t('pendingApprovals') },
        { id: 'companies', icon: 'apartment', label: t('companies') },
        { id: 'all-users', icon: 'people', label: t('allUsers') },
      ]},
      { label: 'CRM', items: [
        { id: 'properties', icon: 'home', label: t('properties') },
        { id: 'contacts', icon: 'contacts', label: t('contacts') },
        { id: 'leads', icon: 'description', label: t('leads') },
        { id: 'opportunities', icon: 'work', label: t('opportunities') },
      ]},
    )
  } else if (isCompanyAdmin) {
    navSections.push(
      { label: t('companies').toUpperCase(), items: [
        { id: 'dashboard', icon: 'dashboard', label: t('dashboard') },
        { id: 'employees', icon: 'people', label: t('employees') },
        { id: 'dropdown-values', icon: 'list', label: t('lookupValues') },
      ]},
      { label: 'CRM', items: [
        { id: 'leads', icon: 'description', label: t('leads') },
        { id: 'opportunities', icon: 'work', label: t('opportunities') },
        { id: 'contacts', icon: 'contacts', label: t('contacts') },
      ]},
      { label: t('properties').toUpperCase(), items: [
        { id: 'properties', icon: 'home', label: t('properties') },
        { id: 'documents', icon: 'folder_open', label: t('documents') },
      ]},
    )
  } else {
    navSections.push(
      { label: 'CRM', items: [
        { id: 'leads', icon: 'description', label: t('leads') },
        { id: 'contacts', icon: 'contacts', label: t('contacts') },
      ]},
      { label: t('properties').toUpperCase(), items: [
        { id: 'properties', icon: 'home', label: t('properties') },
      ]},
    )
  }

  return (
    <aside className="sap-sidebar">
      <div className="sap-shell-bar">
        <div className="sap-shell-left">
          <span className="material-icons" style={{ fontSize: '22px' }}>business</span>
          <span className="sap-shell-text">{t('appName')}</span>
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
        <div className="sap-nav-footer-top">
          {/* Language Switcher */}
          <div className="lang-switcher">
            <button 
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              title="English"
            >EN</button>
            <button 
              className={`lang-btn ${lang === 'ar' ? 'active' : ''}`}
              onClick={() => setLang('ar')}
              title="العربية"
            >AR</button>
          </div>
        </div>
        <div className="sap-nav-footer-bottom">
          <div className="sap-user">
            <div className="sap-user-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="sap-user-info">
              <span className="sap-user-name">{user?.name || 'User'}</span>
              <span className="sap-user-role">
                {isSuperAdmin ? t('companyAdmin') : isCompanyAdmin ? t('companyAdmin') : t('employee')}
                {user?.companyName ? ` · ${user.companyName}` : ''}
              </span>
            </div>
          </div>
          <button className="sap-logout" onClick={onLogout} title={t('logout')}>
            <span className="material-icons" style={{ fontSize: '20px' }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
