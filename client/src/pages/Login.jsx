import { useState } from 'react'
import { api, setToken } from '../api'
import { useI18n } from '../i18n'
import './Login.css'

export default function Login({ onLogin }) {
  const { t, lang, setLang } = useI18n()
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
      setSuccess(t('registrationPending'))
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
          <span className="sap-shell-title">{t('appName')}</span>
        </div>
        <div className="sap-shell-right">
          <div className="lang-switcher" style={{ marginRight: '1rem' }}>
            <button 
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >EN</button>
            <button 
              className={`lang-btn ${lang === 'ar' ? 'active' : ''}`}
              onClick={() => setLang('ar')}
            >AR</button>
          </div>
          <span className="sap-shell-product">SaaS CRM</span>
        </div>
      </header>

      <div className="login-container">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-icon">
              <span className="material-icons" style={{ fontSize: '40px', color: '#0a6ed1' }}>business</span>
            </div>
            <h1>{isRegister ? t('registerTitle') : t('loginTitle')}</h1>
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
                <label>{t('mobileNumber')} <span className="required">*</span></label>
                <input
                  type="tel"
                  placeholder={t('enterMobile')}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('password')} <span className="required">*</span></label>
                <input
                  type="password"
                  placeholder={t('enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="sap-btn-login" disabled={loading}>
                {loading ? t('loading') : t('loginButton')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>{t('companyName')} <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder={t('yourCompanyName')}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('contactPersonName')}</label>
                <input
                  type="text"
                  placeholder={t('adminContactName')}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{t('mobileNumber')} <span className="required">*</span></label>
                <input
                  type="tel"
                  placeholder={t('yourMobileNumber')}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('password')} <span className="required">*</span></label>
                <input
                  type="password"
                  placeholder={t('createPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="sap-btn-login" disabled={loading}>
                {loading ? t('loading') : t('registerButton')}
              </button>
            </form>
          )}

          <div className="login-footer">
            <button
              className="sap-link"
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
            >
              {isRegister ? t('hasAccount') + ' ' + t('loginHere') : t('noAccount') + ' ' + t('registerHere')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
