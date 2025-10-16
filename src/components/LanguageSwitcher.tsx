'use client'

import { useEffect, useState } from 'react'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'mr', name: 'मराठी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'ur', name: 'اردو' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
]

declare global {
  interface Window {
    google: any
  }
}

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    
    const savedLang = localStorage.getItem('googtrans') || '/en/en'
    const langCode = savedLang.split('/')[2] || 'en'
    setCurrentLang(langCode)
  }, [])

  const changeLanguage = (langCode: string) => {
    
    const newLang = langCode === 'en' ? '/en/en' : `/en/${langCode}`

    document.cookie = `googtrans=${newLang};path=/;domain=${window.location.hostname}`
    document.cookie = `googtrans=${newLang};path=/`

    localStorage.setItem('googtrans', newLang)
    localStorage.setItem('preferredLanguage', langCode)

    setCurrentLang(langCode)

    window.location.reload()
  }

  return (
    <div className="relative inline-block">
      <select
        value={currentLang}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>

      {}
      <div id="google_translate_element" className="hidden"></div>
    </div>
  )
}
