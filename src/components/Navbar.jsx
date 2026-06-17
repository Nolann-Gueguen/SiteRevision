import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Home, Layers, CreditCard, Plus, Menu, X, Brain, LogOut, FileText } from 'lucide-react'
import './Navbar.css'

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/matieres', icon: Layers, label: 'Matières' },
  { path: '/flashcards', icon: FileText, label: 'Fiches de révision' },
  { path: '/evaluation', icon: Brain, label: 'Évaluations' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const go = (path) => { navigate(path); setOpen(false) }

  return (
    <>
      <button className="nav-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav className={`navbar ${open ? 'open' : ''}`}>
        <div className="nav-brand" onClick={() => go('/')}>
          <div className="nav-brand-icon-wrap">
            <BookOpen size={20} />
          </div>
          <span className="nav-brand-text">StudySpace</span>
        </div>

        <div className="nav-section-label">Navigation</div>

        <div className="nav-links">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              className={`nav-item ${isActive(path) ? 'active' : ''}`}
              onClick={() => go(path)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="nav-divider" />

        <button className="nav-cta" onClick={() => go('/editeur')}>
          <Plus size={17} />
          <span>Nouveau cours</span>
        </button>

        <div className="nav-footer">
          <div className="nav-user">
            <div className="nav-user-avatar">{user?.[0]?.toUpperCase()}</div>
            <span className="nav-user-name">{user}</span>
          </div>
          <button className="nav-logout" onClick={logout} title="Se déconnecter">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {open && <div className="nav-overlay" onClick={() => setOpen(false)} />}
    </>
  )
}
