import { createContext, useContext, useState, useEffect } from 'react'
import en from './en'
import ar from './ar'

const translations = { en, ar }
const I18nContext = createContext()

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('cb_lang') || 'en')

  useEffect(() => {
    localStorage.setItem('cb_lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.body.classList.toggle('rtl', lang === 'ar')
    document.body.classList.toggle('ltr', lang === 'en')
  }, [lang])

  function t(key, params = {}) {
    let text = translations[lang][key] || translations.en[key] || key
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    })
    return text
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
