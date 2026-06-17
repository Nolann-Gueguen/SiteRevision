import React, { useState } from 'react'
import { getCourses, SUBJECTS } from '../utils/storage'
import SubjectIcon from '../components/SubjectIcon'
import { ChevronDown, ChevronRight, BookOpen, FileText } from 'lucide-react'
import './ResumesPage.css'

function SubjectResume({ subject, courses }) {
  const [open, setOpen] = useState(true)

  if (courses.length === 0) return null

  return (
    <div className="resume-subject">
      <button className="resume-subject-header" onClick={() => setOpen(o => !o)}>
        <div className="resume-subject-icon">
          <SubjectIcon icon={subject.icon} size={18} color={subject.color} />
        </div>
        <h2 className="resume-subject-title" style={{ color: subject.color }}>{subject.label}</h2>
        <span className="resume-subject-count">{courses.length} cours</span>
        <span className="resume-chevron">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>

      {open && (
        <div className="resume-courses">
          {courses.map(course => (
            <div key={course.id} className="resume-course-card" style={{ '--border-color': subject.color }}>
              <div className="resume-course-header">
                <FileText size={15} style={{ color: subject.color, flexShrink: 0 }} />
                <h3 className="resume-course-title">{course.title || 'Sans titre'}</h3>
              </div>
              <div
                className="resume-course-content tiptap-render"
                dangerouslySetInnerHTML={{ __html: course.content }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ResumesPage() {
  const courses = getCourses()
  const [filter, setFilter] = useState('')

  const filtered = filter ? courses.filter(c => c.subjectId === filter) : courses

  const hasContent = SUBJECTS.some(s => filtered.some(c => c.subjectId === s.id))

  return (
    <div className="resumes-page page-enter">
      <div className="resumes-header">
        <div>
          <h1 className="page-title">Fiches de révision</h1>
          <p className="page-sub">Vue condensée de tous vos cours, organisée par matière.</p>
        </div>
        <select
          className="resume-filter"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="">Toutes les matières</option>
          {SUBJECTS.map(s => (
            <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
          ))}
        </select>
      </div>

      {!hasContent ? (
        <div className="resumes-empty">
          <BookOpen size={48} color="var(--text2)" strokeWidth={1.5} />
          <h3>Aucune fiche pour l'instant</h3>
          <p>Créez des cours et ils apparaîtront ici, organisés par matière.</p>
        </div>
      ) : (
        <div className="resumes-content">
          {SUBJECTS.map(subject => (
            <SubjectResume
              key={subject.id}
              subject={subject}
              courses={filtered.filter(c => c.subjectId === subject.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
