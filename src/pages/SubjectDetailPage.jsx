import React, { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SUBJECTS, generateId } from '../utils/storage'
import { api } from '../api'
import { useData } from '../hooks/useData'
import {
  Plus, FolderPlus, Folder, FolderOpen, FileText,
  GripVertical, Pencil, Trash2, ChevronRight, ChevronDown, ArrowLeft
} from 'lucide-react'
import SubjectIcon from '../components/SubjectIcon'
import './SubjectDetailPage.css'

function SortableCourse({ course, onEdit, onDelete, subjectColor }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="course-item">
      <div className="course-drag" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
      <FileText size={16} style={{ color: subjectColor, flexShrink: 0 }} />
      <span className="course-item-title" onClick={() => onEdit(course)}>{course.title || 'Sans titre'}</span>
      <div className="course-item-actions">
        <button className="icon-btn" onClick={() => onEdit(course)}><Pencil size={14} /></button>
        <button className="icon-btn danger" onClick={() => onDelete(course.id)}><Trash2 size={14} /></button>
      </div>
    </div>
  )
}

function FolderBlock({ folder, courses, onEditCourse, onDeleteCourse, onDeleteFolder, onRenameFolder, subjectColor, onDragEnd }) {
  const [open, setOpen] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(folder.name)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const folderCourses = courses.filter(c => c.folderId === folder.id)

  const handleRename = () => {
    if (name.trim()) onRenameFolder(folder.id, name.trim())
    setRenaming(false)
  }

  return (
    <div className="folder-block">
      <div className="folder-header" onClick={() => !renaming && setOpen(o => !o)}>
        <div className="folder-header-left">
          <GripVertical size={16} className="folder-drag-handle" />
          {open ? <FolderOpen size={18} style={{ color: subjectColor }} /> : <Folder size={18} style={{ color: subjectColor }} />}
          {renaming ? (
            <input
              className="folder-rename-input"
              value={name}
              autoFocus
              onClick={e => e.stopPropagation()}
              onChange={e => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
            />
          ) : (
            <span className="folder-name">{folder.name}</span>
          )}
          <span className="folder-count">{folderCourses.length}</span>
        </div>
        <div className="folder-actions" onClick={e => e.stopPropagation()}>
          <button className="icon-btn" onClick={() => setRenaming(true)}><Pencil size={14} /></button>
          <button className="icon-btn danger" onClick={() => onDeleteFolder(folder.id)}><Trash2 size={14} /></button>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {open && (
        <div className="folder-content">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => onDragEnd(e, folder.id)}>
            <SortableContext items={folderCourses.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {folderCourses.map(course => (
                <SortableCourse
                  key={course.id}
                  course={course}
                  onEdit={onEditCourse}
                  onDelete={onDeleteCourse}
                  subjectColor={subjectColor}
                />
              ))}
            </SortableContext>
          </DndContext>
          {folderCourses.length === 0 && (
            <div className="folder-empty">Dossier vide</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SubjectDetailPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const subject = SUBJECTS.find(s => s.id === subjectId)

  const { data: allCourses = [], reload: reloadCourses } = useData(() => api.getCourses())
  const { data: allFolders = [], reload: reloadFolders } = useData(() => api.getFolders(subjectId))

  const courses = allCourses.filter(c => c.subjectId === subjectId)
  const folders = allFolders
  const rootCourses = courses.filter(c => !c.folderId)

  const reload = () => { reloadCourses(); reloadFolders() }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback(async (event, folderId = null) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const list = folderId
      ? courses.filter(c => c.folderId === folderId)
      : rootCourses
    const oldIdx = list.findIndex(c => c.id === active.id)
    const newIdx = list.findIndex(c => c.id === over.id)
    const reordered = arrayMove(list, oldIdx, newIdx)
    await Promise.all(reordered.map((c, i) => api.saveCourse({ ...c, order: i })))
    reloadCourses()
  }, [courses, rootCourses])

  const handleDeleteCourse = async (id) => {
    if (confirm('Supprimer ce cours ? La flashcard associée sera aussi supprimée.')) {
      await api.deleteCourse(id)
      reloadCourses()
    }
  }

  const handleDeleteFolder = async (id) => {
    if (confirm('Supprimer ce dossier ? Les cours seront déplacés à la racine.')) {
      await api.deleteFolder(id)
      reload()
    }
  }

  const handleRenameFolder = async (id, name) => {
    const folder = folders.find(f => f.id === id)
    await api.saveFolder({ ...folder, name })
    reloadFolders()
  }

  const addFolder = async () => {
    const name = prompt('Nom du dossier :')
    if (name?.trim()) {
      await api.saveFolder({ id: generateId(), name: name.trim(), subjectId, order: folders.length })
      reloadFolders()
    }
  }

  if (!subject) return <div className="not-found">Matière introuvable.</div>

  const sortedRootCourses = [...rootCourses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const sortedFolders = [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className="subject-detail page-enter">
      <div className="sd-header">
        <button className="back-btn" onClick={() => navigate('/matieres')}>
          <ArrowLeft size={18} /> Matières
        </button>
        <div className="sd-title-row">
          <div className="sd-icon">
            <SubjectIcon icon={subject.icon} size={24} color={subject.color} />
          </div>
          <h1 className="sd-title" style={{ color: subject.color }}>{subject.label}</h1>
          <span className="sd-badge">{courses.length} cours</span>
        </div>
        <div className="sd-actions">
          <button className="btn-outline" onClick={addFolder}>
            <FolderPlus size={16} /> Nouveau dossier
          </button>
          <button className="btn-primary" onClick={() => navigate(`/editeur?subject=${subjectId}`)}>
            <Plus size={16} /> Nouveau cours
          </button>
        </div>
      </div>

      <div className="sd-content">
        {sortedFolders.map(folder => (
          <FolderBlock
            key={folder.id}
            folder={folder}
            courses={courses}
            onEditCourse={c => navigate(`/editeur/${c.id}`)}
            onDeleteCourse={handleDeleteCourse}
            onDeleteFolder={handleDeleteFolder}
            onRenameFolder={handleRenameFolder}
            subjectColor={subject.color}
            onDragEnd={handleDragEnd}
          />
        ))}

        {sortedRootCourses.length > 0 && (
          <div className="root-courses">
            {folders.length > 0 && <div className="root-label">Sans dossier</div>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, null)}>
              <SortableContext items={sortedRootCourses.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {sortedRootCourses.map(course => (
                  <SortableCourse
                    key={course.id}
                    course={course}
                    onEdit={c => navigate(`/editeur/${c.id}`)}
                    onDelete={handleDeleteCourse}
                    subjectColor={subject.color}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {courses.length === 0 && (
          <div className="sd-empty">
            <SubjectIcon icon={subject.icon} size={40} color="var(--text2)" />
            <h3>Aucun cours pour l'instant</h3>
            <p>Créez votre premier cours pour cette matière.</p>
            <button className="btn-primary" onClick={() => navigate(`/editeur?subject=${subjectId}`)}>
              <Plus size={16} /> Créer un cours
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
