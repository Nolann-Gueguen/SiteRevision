import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { SUBJECTS, generateId, generateFlashcardFromCourse } from '../utils/storage'
import { api } from '../api'
import { useData } from '../hooks/useData'
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, ImageIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Undo, Redo, Save, CheckSquare,
  ChevronDown, ArrowLeft, Type, Minus, Folder
} from 'lucide-react'
import './EditorPage.css'

const HIGHLIGHT_COLORS = [
  { color: '#fde68a', label: 'Jaune' },
  { color: '#bbf7d0', label: 'Vert' },
  { color: '#bfdbfe', label: 'Bleu' },
  { color: '#fecaca', label: 'Rouge' },
  { color: '#e9d5ff', label: 'Violet' },
  { color: '#fed7aa', label: 'Orange' },
  { color: '#f9a8d4', label: 'Rose' },
  { color: '#a7f3d0', label: 'Turquoise' },
]

const TEXT_COLORS = [
  '#e8eaf6', '#6c63ff', '#a78bfa', '#ec4899',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#84cc16', '#f97316', '#06b6d4', '#8b5cf6',
]

function ColorPicker({ colors, onSelect }) {
  return (
    <div className="color-picker-grid">
      {colors.map(c => (
        <button
          key={typeof c === 'string' ? c : c.color}
          className="color-swatch"
          title={typeof c === 'string' ? c : c.label}
          style={{ background: typeof c === 'string' ? c : c.color }}
          onClick={() => onSelect(typeof c === 'string' ? c : c.color)}
        />
      ))}
    </div>
  )
}

function ToolbarDropdown({ trigger, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="toolbar-dropdown" ref={ref}>
      <button className="toolbar-btn" onClick={() => setOpen(o => !o)}>{trigger}</button>
      {open && <div className="toolbar-dropdown-menu" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  )
}

export default function EditorPage() {
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState(searchParams.get('subject') || '')
  const [folderId, setFolderId] = useState('')
  const [saved, setSaved] = useState(false)
  const [flashcardCreated, setFlashcardCreated] = useState(false)
  const [courseLoaded, setCourseLoaded] = useState(false)
  const existingCourseRef = useRef(null)

  const { data: allFolders = [] } = useData(() => api.getFolders(subjectId || null), [subjectId])
  const availableFolders = allFolders.filter(f => f.subjectId === subjectId)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '<p>Commencez à écrire votre cours ici...</p>',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        spellcheck: 'false',
      },
    },
  })

  useEffect(() => {
    if (!courseId || !editor) return
    api.getCourse(courseId).then(course => {
      existingCourseRef.current = course
      setTitle(course.title || '')
      setSubjectId(course.subjectId || '')
      setFolderId(course.folderId || '')
      editor.commands.setContent(course.content || '')
      setCourseLoaded(true)
    }).catch(() => setCourseLoaded(true))
  }, [courseId, editor])

  const handleSave = useCallback(async () => {
    if (!editor) return
    const existing = existingCourseRef.current
    const course = {
      id: courseId || generateId(),
      title: title || 'Sans titre',
      subjectId,
      folderId: folderId || null,
      content: editor.getHTML(),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      order: existing?.order ?? 0,
    }
    await api.saveCourse(course)
    existingCourseRef.current = course
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [editor, title, subjectId, folderId, courseId])

  const handleValidate = useCallback(async () => {
    if (!editor) return
    const existing = existingCourseRef.current
    const id = courseId || generateId()
    const course = {
      id,
      title: title || 'Sans titre',
      subjectId,
      folderId: folderId || null,
      content: editor.getHTML(),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      order: existing?.order ?? 0,
    }
    await api.saveCourse(course)

    const flashcards = await api.getFlashcards()
    const existingFc = flashcards.find(f => f.courseId === id)
    const fc = generateFlashcardFromCourse(course)
    if (existingFc) fc.id = existingFc.id
    await api.saveFlashcard(fc)

    setFlashcardCreated(true)
    setTimeout(() => {
      setFlashcardCreated(false)
      if (subjectId) navigate(`/matieres/${subjectId}`)
      else navigate('/matieres')
    }, 2000)
  }, [editor, title, subjectId, folderId, courseId, navigate])

  const insertImage = (e) => {
    const file = e.target.files[0]
    if (!file || !editor) return
    const reader = new FileReader()
    reader.onload = ev => {
      editor.chain().focus().setImage({ src: ev.target.result }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (!editor) return null

  return (
    <div className="editor-page page-enter">
      <div className="editor-topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <input
          className="editor-title-input"
          placeholder="Titre du cours..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div className="editor-topbar-actions">
          <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={handleSave}>
            <Save size={16} />
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
          <button
            className={`btn-validate ${flashcardCreated ? 'done' : ''}`}
            onClick={handleValidate}
          >
            <CheckSquare size={16} />
            {flashcardCreated ? 'Flashcard créée !' : 'Valider et créer flashcard'}
          </button>
        </div>
      </div>

      <div className="editor-meta">
        <div className="meta-field">
          <label>Matière</label>
          <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setFolderId('') }}>
            <option value="">— Sélectionner une matière —</option>
            {SUBJECTS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        {subjectId && availableFolders.length > 0 && (
          <div className="meta-field">
            <label><Folder size={14} /> Dossier</label>
            <select value={folderId} onChange={e => setFolderId(e.target.value)}>
              <option value="">Sans dossier</option>
              {availableFolders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="editor-wrapper">
        <div className="editor-toolbar">
          <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Annuler"><Undo size={16} /></button>
          <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Rétablir"><Redo size={16} /></button>
          <div className="toolbar-sep" />

          <button className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Titre 1">
            <Heading1 size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titre 2">
            <Heading2 size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titre 3">
            <Heading3 size={16} />
          </button>
          <div className="toolbar-sep" />

          <button className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()} title="Gras">
            <Bold size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique">
            <Italic size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné">
            <UnderlineIcon size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()} title="Barré">
            <Strikethrough size={16} />
          </button>
          <div className="toolbar-sep" />

          <ToolbarDropdown trigger={<><Type size={16} /><ChevronDown size={12} /></>}>
            <div className="dropdown-label">Couleur du texte</div>
            <ColorPicker colors={TEXT_COLORS} onSelect={c => editor.chain().focus().setColor(c).run()} />
            <button className="dropdown-clear" onClick={() => editor.chain().focus().unsetColor().run()}>
              Réinitialiser
            </button>
          </ToolbarDropdown>

          <ToolbarDropdown trigger={<><Highlighter size={16} /><ChevronDown size={12} /></>}>
            <div className="dropdown-label">Surlignage</div>
            <ColorPicker
              colors={HIGHLIGHT_COLORS}
              onSelect={c => editor.chain().focus().toggleHighlight({ color: c }).run()}
            />
            <button className="dropdown-clear" onClick={() => editor.chain().focus().unsetHighlight().run()}>
              Effacer
            </button>
          </ToolbarDropdown>
          <div className="toolbar-sep" />

          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Gauche">
            <AlignLeft size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centre">
            <AlignCenter size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Droite">
            <AlignRight size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justifié">
            <AlignJustify size={16} />
          </button>
          <div className="toolbar-sep" />

          <button className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
            <List size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
            <ListOrdered size={16} />
          </button>
          <button className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">
            <Quote size={16} />
          </button>
          <button className="toolbar-btn"
            onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
            <Minus size={16} />
          </button>
          <div className="toolbar-sep" />

          <button className="toolbar-btn" onClick={() => fileInputRef.current?.click()} title="Insérer une image">
            <ImageIcon size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={insertImage}
          />
        </div>

        <EditorContent editor={editor} className="editor-area" />
      </div>
    </div>
  )
}
