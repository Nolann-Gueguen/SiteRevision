import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import './LoginPage.css'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const ok = login(username.trim(), password)
    if (!ok) setError('Identifiants incorrects. Réessayez.')
    setLoading(false)
  }

  return (
    <div className="login-bg">
      <div className="login-left">
        <div className="login-brand">
          <BookOpen size={28} />
          <span>StudySpace</span>
        </div>
        <div className="login-tagline">
          <h1>Vos révisions,<br />organisées.</h1>
          <p>Créez vos fiches, générez des flashcards,<br />et progressez matière par matière.</p>
        </div>
        <div className="login-deco">
          <div className="deco-pill" style={{ '--c': '#6c63ff' }}>Perspective</div>
          <div className="deco-pill" style={{ '--c': '#ec4899' }}>PAO</div>
          <div className="deco-pill" style={{ '--c': '#10b981' }}>Culture Architecturale</div>
          <div className="deco-pill" style={{ '--c': '#f59e0b' }}>Croquis</div>
          <div className="deco-pill" style={{ '--c': '#06b6d4' }}>Architecture d'Intérieur</div>
          <div className="deco-pill" style={{ '--c': '#a855f7' }}>Registre Déco</div>
          <div className="deco-pill" style={{ '--c': '#3b82f6' }}>Scénographie</div>
          <div className="deco-pill" style={{ '--c': '#84cc16' }}>Anglais</div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Connexion</h2>
            <p>Entrez vos identifiants pour accéder à votre espace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Identifiant</label>
              <div className="login-input-wrap">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Votre identifiant"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-field">
              <label>Mot de passe</label>
              <div className="login-input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading || !username || !password}>
              {loading ? <span className="login-spinner" /> : 'Se connecter'}
            </button>
          </form>

          <div className="login-hint">
            <p>Identifiant par défaut : <code>admin</code></p>
            <p>Mot de passe par défaut : <code>studyspace2024</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
