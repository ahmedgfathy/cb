import { useState, useEffect } from 'react'
import { api, getToken } from './api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PendingApprovals from './pages/PendingApprovals'
import Companies from './pages/Companies'
import AllUsers from './pages/AllUsers'
import Employees from './pages/Employees'
import Properties from './pages/Properties'
import Contacts from './pages/Contacts'
import Leads from './pages/Leads'
import Opportunities from './pages/Opportunities'
import Documents from './pages/Documents'
import LookupValues from './pages/LookupValues'
import Sidebar from './components/Sidebar'
import './App.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken())
  const [page, setPage] = useState(() => localStorage.getItem('cb_page') || 'dashboard')
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (loggedIn && !user) {
      api.me().then(setUser).catch(() => {
        setLoggedIn(false)
      })
    }
  }, [loggedIn])

  function handlePageChange(p) {
    setPage(p)
    localStorage.setItem('cb_page', p)
  }

  function handleLogin(userData) {
    setLoggedIn(true)
    setUser(userData)
    const saved = localStorage.getItem('cb_page') || 'dashboard'
    setPage(saved)
  }

  function handleLogout() {
    localStorage.removeItem('cb_token')
    localStorage.removeItem('cb_page')
    setLoggedIn(false)
    setUser(null)
    setPage('dashboard')
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />
  }

  const isSuperAdmin = user?.role === 'super_admin'
  const isCompanyAdmin = user?.role === 'company_admin'

  const pages = {}

  if (isSuperAdmin) {
    pages.dashboard = <Dashboard user={user} />
    pages.pending = <PendingApprovals />
    pages.companies = <Companies />
    pages['all-users'] = <AllUsers />
  } else if (isCompanyAdmin) {
    pages.dashboard = <Dashboard user={user} />
    pages.employees = <Employees user={user} />
    pages['dropdown-values'] = <LookupValues />
  }

  // Shared CRM pages
  pages.properties = <Properties />
  pages.contacts = <Contacts />
  pages.leads = <Leads />
  pages.opportunities = <Opportunities />
  pages.documents = <Documents />

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={handlePageChange} user={user} onLogout={handleLogout} />
      <main className="main-content">
        {pages[page] || <Dashboard />}
      </main>
    </div>
  )
}

export default App
