import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Settings, Zap } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Sidebar({ theme, onToggleTheme }) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={20} />
        </div>
        <div className="sidebar-brand-text">
          <h1>FSN</h1>
          <p>Serial Number Generator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard />
          Dashboard
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings />
          Settings
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </aside>
  )
}
