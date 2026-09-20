import { useState } from 'react'
import { api, setToken } from '../api'
import './Login.css'

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(mobile, password)
      setToken(data.token)
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.register({
        company_name: companyName,
        mobile,
        password,
        contact_name: contactName,
      })
      setSuccess('Registration submitted! Waiting for admin approval. You will be able to login once approved.')
      setCompanyName('')
      setContactName('')
      setMobile('')
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <header className="sap-shell">
        <div className="sap-shell-left">
          <span className="sap-logo">🏢</span>
          <span className="sap-shell-title">CB Real Estate</span>
        </div>
        <div className="sap-shell-right">
          <span className="sap-shell-product">SaaS CRM</span>
        </div>
      </header>

      <div className="login-container">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-icon">
              <span className="material-icons" style={{ fontSize: '40px', color: '#0a6ed1' }}>business</span>
            </div>
            <h1>{isRegister ? 'Register Your Company' : 'Sign In'}</h1>
            <p className="login-subtitle">
              {isRegister
                ? 'Submit your company for approval to get started'
                : 'Enter your mobile number to sign in'}
            </p>
          </div>

          {error && (
            <div className="sap-message sap-message-error">
              <span className="material-icons">error</span><span>{error}</span>
            </div>
          )}

          {success && (
            <div className="sap-message sap-message-success">
              <span className="material-icons">check_circle</span><span>{success}</span>
            </div>
          )}

          {!isRegister ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Mobile Number <span className="required">*</span></label>
                <input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password <span className="required">*</span></label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="sap-btn-login" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Company Name <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Person Name</label>
                <input
                  type="text"
                  placeholder="Admin contact name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Mobile Number <span className="required">*</span></label>
                <input
                  type="tel"
                  placeholder="Your mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password <span className="required">*</span></label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="sap-btn-login" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <button
              className="sap-link"
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
            >
              {isRegister ? 'Already registered? Sign In' : "New company? Register here"}
            </button>
          </div>


        </div>
      </div>
    </div>
  )
}
