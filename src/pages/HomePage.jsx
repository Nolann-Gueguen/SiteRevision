import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBJECTS } from '../utils/storage'
import { api } from '../api'
import { useData } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'
import SubjectIcon from '../components/SubjectIcon'
import { Plus, ArrowRight, Clock, Brain, FileText } from 'lucide-react'
import './HomePage.css'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function greeting(name) {
  const h = new Date().getHours()
  if (h < 6) return `Nuit blanche, ${name} ?`
  if (h < 12) return `Bonne matinée, ${name}`
  if (h < 18) return `Bon après-midi, ${name}`
  return `Bonsoir, ${name}`
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: courses = [] } = useData(() => api.getCourses())
  const { data: flashcards = [] } = useData(() => api.getFlashcards())

  const recent = useMemo(
    () => [...courses].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6),
    [courses]
  )

  const activeSubjects = useMemo(
    () => SUBJECTS.filter(s => courses.some(c => c.subjectId === s.id)),
    [courses]
  )

  return (
    <div className="home page-enter">
      <div className="home-top">
        <div className="home-greeting">
          <p className="greeting-text">{greeting(user)}</p>
          <h1 className="home-title">
            {courses.length === 0
              ? 'Commençons les révisions'
              : `${courses.length} cours enregistré${courses.length > 1 ? 's' : ''}`}
          </h1>
        </div>
        <button className="btn-new-course" onClick={() => navigate('/editeur')}>
          <Plus size={17} /> Nouveau cours
        </button>
      </div>

      {courses.length > 0 && (
        <div className="home-stats">
          <div className="stat-item" onClick={() => navigate('/matieres')}>
            <span className="stat-num">{courses.length}</span>
            <span className="stat-lbl">cours</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-item" onClick={() => navigate('/flashcards')}>
            <span className="stat-num">{activeSubjects.length}</span>
            <span className="stat-lbl">matières</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-item" onClick={() => navigate('/evaluation')}>
            <span className="stat-num">{flashcards.length}</span>
            <span className="stat-lbl">cartes d'éval</span>
          </div>
        </div>
      )}

      <div className="home-grid">
        {recent.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2><Clock size={16} /> Derniers cours</h2>
              <button className="link-btn" onClick={() => navigate('/matieres')}>
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            <div className="recent-list">
              {recent.map(course => {
                const sub = SUBJECTS.find(s => s.id === course.subjectId)
                return (
                  <button
                    key={course.id}
                    className="recent-item"
                    onClick={() => navigate(`/editeur/${course.id}`)}
                  >
                    <div className="recent-icon">
                      {sub ? <SubjectIcon icon={sub.icon} size={16} color={sub.color} /> : <FileText size={16} color="var(--text2)" />}
                    </div>
                    <div className="recent-info">
                      <span className="recent-title">{course.title || 'Sans titre'}</span>
                      <span className="recent-meta">
                        <span style={{ color: sub?.color }}>{sub?.label || 'Sans matière'}</span>
                        {' · '}{timeAgo(course.updatedAt)}
                      </span>
                    </div>
                    <ArrowRight size={14} className="recent-arrow" />
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {activeSubjects.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2>Mes matières</h2>
              <button className="link-btn" onClick={() => navigate('/matieres')}>
                Toutes <ArrowRight size={14} />
              </button>
            </div>
            <div className="subject-pills">
              {activeSubjects.map(s => {
                const count = courses.filter(c => c.subjectId === s.id).length
                return (
                  <button
                    key={s.id}
                    className="subject-pill"
                    style={{ '--c': s.color }}
                    onClick={() => navigate(`/matieres/${s.id}`)}
                  >
                    <div className="pill-icon">
                      <SubjectIcon icon={s.icon} size={16} color={s.color} />
                    </div>
                    <div>
                      <div className="pill-label">{s.label}</div>
                      <div className="pill-count">{count} cours</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {courses.length > 0 && (
        <div className="home-shortcuts">
          <button className="shortcut-card" onClick={() => navigate('/flashcards')}>
            <div className="shortcut-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <FileText size={22} color="#10b981" />
            </div>
            <div>
              <div className="shortcut-title">Fiches de révision</div>
              <div className="shortcut-sub">Vue condensée par matière</div>
            </div>
            <ArrowRight size={16} className="shortcut-arrow" />
          </button>
          <button className="shortcut-card" onClick={() => navigate('/evaluation')}>
            <div className="shortcut-icon" style={{ background: 'rgba(108,99,255,0.15)' }}>
              <Brain size={22} color="var(--accent2)" />
            </div>
            <div>
              <div className="shortcut-title">Évaluation</div>
              <div className="shortcut-sub">{flashcards.length} carte{flashcards.length > 1 ? 's' : ''} à retourner</div>
            </div>
            <ArrowRight size={16} className="shortcut-arrow" />
          </button>
        </div>
      )}

      {courses.length === 0 && (
        <div className="home-empty">
          <p className="empty-sub">Par où commencer ?</p>
          <div className="empty-actions">
            <button className="btn-new-course large" onClick={() => navigate('/editeur')}>
              <Plus size={18} /> Créer mon premier cours
            </button>
          </div>
          <div className="empty-subjects">
            <p>Matières disponibles :</p>
            <div className="empty-pills">
              {SUBJECTS.map(s => (
                <span key={s.id} className="empty-pill" style={{ '--c': s.color }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
