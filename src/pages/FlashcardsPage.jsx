import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFlashcards, saveFlashcard, deleteFlashcard,
  getCourses, SUBJECTS, generateId
} from '../utils/storage'
import {
  CreditCard, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  X, Check, RotateCcw, Eye, EyeOff, Layers
} from 'lucide-react'
import './FlashcardsPage.css'

function FlashCard({ fc, subjectColor, onEdit, onDelete }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flashcard-wrapper">
      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
        <div className="flashcard-front" style={{ '--sc': subjectColor }}>
          <div className="fc-hint">Question</div>
          <div className="fc-content">{fc.question}</div>
          <div className="fc-flip-hint"><RotateCcw size={14} /> Cliquer pour retourner</div>
        </div>
        <div className="flashcard-back" style={{ '--sc': subjectColor }}>
          <div className="fc-hint">Réponse</div>
          <div className="fc-content fc-answer">{fc.answer}</div>
        </div>
      </div>
      <div className="flashcard-actions">
        <button className="fc-action-btn" onClick={() => onEdit(fc)}><Pencil size={14} /></button>
        <button className="fc-action-btn danger" onClick={() => onDelete(fc.id)}><Trash2 size={14} /></button>
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
          <h3>{fc?.id ? 'Modifier la flashcard' : 'Nouvelle flashcard'}</h3>
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
              placeholder="Entrez la question..."
            />
          </div>
          <div className="modal-field">
            <label>Réponse</label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={5}
              placeholder="Entrez la réponse..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSave}><Check size={16} /> Sauvegarder</button>
        </div>
      </div>
    </div>
  )
}

function SubjectGroup({ subject, flashcards, onEdit, onDelete }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="fc-group">
      <div className="fc-group-header" onClick={() => setOpen(o => !o)}>
        <span style={{ '--sc': subject.color }} className="fc-group-emoji">{subject.emoji}</span>
        <span className="fc-group-label" style={{ color: subject.color }}>{subject.label}</span>
        <span className="fc-group-count">{flashcards.length} card{flashcards.length > 1 ? 's' : ''}</span>
        <span className="fc-group-chevron">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </div>
      {open && (
        <div className="fc-group-cards">
          {flashcards.map(fc => (
            <FlashCard
              key={fc.id}
              fc={fc}
              subjectColor={subject.color}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FlashcardsPage() {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [editingFc, setEditingFc] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('')

  const flashcards = getFlashcards()
  const courses = getCourses()

  const reload = () => setRefresh(r => r + 1)

  const handleDelete = (id) => {
    if (confirm('Supprimer cette flashcard ?')) {
      deleteFlashcard(id)
      reload()
    }
  }

  const handleEdit = (fc) => {
    setEditingFc(fc)
    setShowModal(true)
  }

  const handleSave = (fc) => {
    saveFlashcard(fc)
    setShowModal(false)
    setEditingFc(null)
    reload()
  }

  const filtered = filter
    ? flashcards.filter(fc => fc.subjectId === filter)
    : flashcards

  const grouped = SUBJECTS.map(s => ({
    subject: s,
    cards: filtered.filter(fc => fc.subjectId === s.id),
  })).filter(g => g.cards.length > 0)

  const ungrouped = filtered.filter(fc => !fc.subjectId)

  return (
    <div className="flashcards-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="page-sub">
            {flashcards.length} flashcard{flashcards.length > 1 ? 's' : ''} — cliquez pour retourner
          </p>
        </div>
        <div className="fc-header-actions">
          <select className="fc-filter" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Toutes les matières</option>
            {SUBJECTS.map(s => (
              <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={() => { setEditingFc(null); setShowModal(true) }}>
            <Plus size={16} /> Nouvelle flashcard
          </button>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <div className="fc-empty">
          <CreditCard size={48} color="var(--text2)" />
          <h3>Aucune flashcard</h3>
          <p>Validez un cours pour générer automatiquement une flashcard, ou créez-en une manuellement.</p>
          <div className="fc-empty-actions">
            <button className="btn-secondary" onClick={() => navigate('/editeur')}>
              <Layers size={16} /> Créer un cours
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Créer manuellement
            </button>
          </div>
        </div>
      ) : (
        <div className="fc-content">
          {grouped.map(({ subject, cards }) => (
            <SubjectGroup
              key={subject.id}
              subject={subject}
              flashcards={cards}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {ungrouped.length > 0 && (
            <div className="fc-group">
              <div className="fc-group-header">
                <span className="fc-group-label">Sans matière</span>
                <span className="fc-group-count">{ungrouped.length}</span>
              </div>
              <div className="fc-group-cards">
                {ungrouped.map(fc => (
                  <FlashCard
                    key={fc.id}
                    fc={fc}
                    subjectColor="#6c63ff"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
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
