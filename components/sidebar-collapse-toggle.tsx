'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect, useState } from 'react'

const storageKey = 'module-sidebar-collapsed'
const className = 'module-sidebar-collapsed'

function applyCollapsed(collapsed: boolean) {
  document.documentElement.classList.toggle(className, collapsed)
}

export function SidebarCollapseToggle() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) === '1'
    setCollapsed(saved)
    applyCollapsed(saved)
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    window.localStorage.setItem(storageKey, next ? '1' : '0')
    setCollapsed(next)
    applyCollapsed(next)
  }

  return (
    <button
      type="button"
      className="btn-ghost w-full justify-start module-sidebar-control"
      onClick={toggleCollapsed}
      aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
      title={collapsed ? 'Expandir menu' : 'Recolher menu'}
    >
      {collapsed ? (
        <PanelLeftOpen size={16} aria-hidden="true" />
      ) : (
        <PanelLeftClose size={16} aria-hidden="true" />
      )}
      <span className="module-sidebar-text">
        {collapsed ? 'Expandir menu' : 'Recolher menu'}
      </span>
    </button>
  )
}
