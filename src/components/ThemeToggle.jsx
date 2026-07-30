import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <div className="theme-toggle" onClick={onToggle}>
      <span className="theme-toggle-label">
        {theme === 'dark' ? <Moon /> : <Sun />}
        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </span>
      <div className="toggle-track">
        <div className="toggle-thumb" />
      </div>
    </div>
  )
}
