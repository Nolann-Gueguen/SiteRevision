import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBJECTS, getCourses } from '../utils/storage'
import SubjectIcon from '../components/SubjectIcon'
import { Plus } from 'lucide-react'
import './SubjectsPage.css'

export default function SubjectsPage() {
  const navigate = useNavigate()
  const courses = getCourses()

  return (
    <div className="subjects-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Matières</h1>
          <p className="page-sub">Sélectionnez une matière pour accéder à vos cours.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/editeur')}>
          <Plus size={18} /> Nouveau cours
        </button>
      </div>

      <div className="subjects-grid">
        {SUBJECTS.map(subject => {
          const count = courses.filter(c => c.subjectId === subject.id).length
          return (
            <div
              key={subject.id}
              className="subject-card"
              style={{ '--color': subject.color }}
              onClick={() => navigate(`/matieres/${subject.id}`)}
            >
              <div className="subject-card-top">
                <div className="subject-card-icon">
                  <SubjectIcon icon={subject.icon} size={22} color={subject.color} />
                </div>
                <div className="subject-card-badge">{count} cours</div>
              </div>
              <div className="subject-card-label">{subject.label}</div>
              <div className="subject-card-bar">
                <div
                  className="subject-card-bar-fill"
                  style={{ width: count > 0 ? `${Math.min(count * 10, 100)}%` : '0%' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
