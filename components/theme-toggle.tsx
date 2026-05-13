'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const storageKey = 'ui-theme'

function getPreferredTheme() {
  if (typeof window === 'undefined') return 'light'

  const saved = window.localStorage.getItem(storageKey)
  if (saved === 'dark' || saved === 'light') return saved

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: string) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.dataset.theme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const preferredTheme = getPreferredTheme()
    setTheme(preferredTheme)
    applyTheme(preferredTheme)
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem(storageKey, nextTheme)
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className="btn-ghost w-full justify-start module-sidebar-control"
      onClick={toggleTheme}
      aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={dark ? 'Tema claro' : 'Tema escuro'}
    >
      {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span className="module-sidebar-text">{dark ? 'Tema claro' : 'Tema escuro'}</span>
    </button>
  )
}
