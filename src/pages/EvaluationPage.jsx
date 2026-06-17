import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFlashcards, saveFlashcard, deleteFlashcard,
  SUBJECTS, generateId
} from '../utils/storage'
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  X, Check, RotateCcw, Brain
} from 'lucide-react'
import SubjectIcon from '../components/SubjectIcon'
import './EvaluationPage.css'

function FlipCard({ fc, subjectColor, onEdit, onDelete }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="eval-card-wrap">
      <div
        className={`eval-card ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(f => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setFlipped(f => !f)}
      >
        <div className="eval-card-inner">
          <div className="eval-face eval-front" style={{ '--sc': subjectColor }}>
            <span className="eval-face-label">Question</span>
            <p className="eval-face-text">{fc.question}</p>
            <span className="eval-flip-hint"><RotateCcw size={13} /> Cliquer pour voir la réponse</span>
          </div>
          <div className="eval-face eval-back" style={{ '--sc': subjectColor }}>
            <span className="eval-face-label">Réponse</span>
            <p className="eval-face-text answer">{fc.answer}</p>
          </div>
        </div>
      </div>
      <div className="eval-card-actions">
        <button className="eval-action-btn" title="Modifier" onClick={() => onEdit(fc)}>
          <Pencil size={13} />
        </button>
        <button className="eval-action-btn danger" title="Supprimer" onClick={() => onDelete(fc.id)}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function EditModal({ fc, onSave, onClose }) {
  const [question, setQuestion] = useState(fc?.question || '')
  const [answer, setAnswer] = useState(fc?.answer || '')
  const [subjectId, setSubjectId] = useState(fc?.subjectId || '')

  const handleSave = () => {
    if (!question.trim()) return
    onSave({
      ...(fc || {}),
      id: fc?.id || generateId(),
      question: question.trim(),
      answer: answer.trim(),
      subjectId,
      createdAt: fc?.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{fc?.id ? 'Modifier la carte' : 'Nouvelle carte'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>Matière</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">— Aucune —</option>
              {SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>Question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={3}
              placeholder="La question à se poser..."
              autoFocus
            />
          </div>
          <div className="modal-field">
            <label>Réponse</label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={5}
              placeholder="La réponse attendue..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSave} disabled={!question.trim()}>
            <Check size={15} /> Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}

function SubjectGroup({ subject, cards, onEdit, onDelete }) {
  const [open, setOpen] = useState(true)

  return (
    <section className="eval-group">
      <button className="eval-group-header" onClick={() => setOpen(o => !o)}>
        <div className="eval-group-icon">
          <SubjectIcon icon={subject.icon} size={16} color={subject.color} />
        </div>
        <span className="eval-group-name" style={{ color: subject.color }}>{subject.label}</span>
        <span className="eval-group-count">{cards.length} carte{cards.length > 1 ? 's' : ''}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="eval-group-cards">
          {cards.map(fc => (
            <FlipCard
              key={fc.id}
              fc={fc}
              subjectColor={subject.color}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function EvaluationPage() {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [editingFc, setEditingFc] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('')

  const flashcards = getFlashcards()
  const reload = () => setRefresh(r => r + 1)

  const handleDelete = (id) => {
    if (confirm('Supprimer cette carte ?')) { deleteFlashcard(id); reload() }
  }
  const handleEdit = (fc) => { setEditingFc(fc); setShowModal(true) }
  const handleSave = (fc) => { saveFlashcard(fc); setShowModal(false); setEditingFc(null); reload() }

  const filtered = filter ? flashcards.filter(fc => fc.subjectId === filter) : flashcards
  const grouped = SUBJECTS.map(s => ({ subject: s, cards: filtered.filter(fc => fc.subjectId === s.id) })).filter(g => g.cards.length > 0)
  const ungrouped = filtered.filter(fc => !fc.subjectId)

  return (
    <div className="eval-page page-enter">
      <div className="eval-header">
        <div>
          <h1 className="page-title">Évaluation des connaissances</h1>
          <p className="page-sub">Retournez les cartes pour tester votre mémoire.</p>
        </div>
        <div className="eval-header-right">
          <select className="eval-filter" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Toutes les matières</option>
            {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setEditingFc(null); setShowModal(true) }}>
            <Plus size={16} /> Nouvelle carte
          </button>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <div className="eval-empty">
          <Brain size={52} color="var(--text2)" strokeWidth={1.5} />
          <h3>Aucune carte d'évaluation</h3>
          <p>Les cartes sont générées automatiquement quand vous validez un cours, ou créez-en une manuellement.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => navigate('/editeur')}>Créer un cours</button>
            <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Créer manuellement</button>
          </div>
        </div>
      ) : (
        <div className="eval-content">
          {grouped.map(({ subject, cards }) => (
            <SubjectGroup key={subject.id} subject={subject} cards={cards} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
          {ungrouped.length > 0 && (
            <section className="eval-group">
              <div className="eval-group-header" style={{ cursor: 'default' }}>
                <span className="eval-group-name">Sans matière</span>
                <span className="eval-group-count">{ungrouped.length}</span>
              </div>
              <div className="eval-group-cards">
                {ungrouped.map(fc => (
                  <FlipCard key={fc.id} fc={fc} subjectColor="#6c63ff" onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {showModal && (
        <EditModal
          fc={editingFc}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingFc(null) }}
        />
      )}
    </div>
  )
}
