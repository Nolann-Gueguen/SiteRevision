const KEYS = {
  courses: 'studyspace_courses',
  folders: 'studyspace_folders',
  flashcards: 'studyspace_flashcards',
}

export const SUBJECTS = [
  { id: 'perspective', label: 'Perspective', color: '#6c63ff', icon: 'Ruler' },
  { id: 'pao', label: 'PAO', color: '#ec4899', icon: 'Monitor' },
  { id: 'croquis', label: 'Croquis', color: '#f59e0b', icon: 'PenLine' },
  { id: 'culture-archi', label: 'Culture Architecturale', color: '#10b981', icon: 'Landmark' },
  { id: 'scenographie', label: 'Scénographie', color: '#3b82f6', icon: 'Clapperboard' },
  { id: 'batiment', label: 'Bâtiment', color: '#8b5cf6', icon: 'Building2' },
  { id: 'materiaux', label: 'Matériaux', color: '#ef4444', icon: 'Layers' },
  { id: 'eclairagisme', label: 'Éclairagisme', color: '#fbbf24', icon: 'Lightbulb' },
  { id: 'archi-interieur', label: "Architecture d'Intérieur", color: '#06b6d4', icon: 'Armchair' },
  { id: 'anglais', label: 'Anglais', color: '#84cc16', icon: 'Globe' },
  { id: 'demarche-deco', label: 'Démarche Déco', color: '#f97316', icon: 'Palette' },
  { id: 'registre-deco', label: 'Registre Déco', color: '#a855f7', icon: 'BookMarked' },
]

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// Courses
export function getCourses() { return load(KEYS.courses) }
export function saveCourse(course) {
  const courses = getCourses()
  const idx = courses.findIndex(c => c.id === course.id)
  if (idx >= 0) courses[idx] = course
  else courses.push(course)
  save(KEYS.courses, courses)
}
export function deleteCourse(id) {
  const courses = getCourses().filter(c => c.id !== id)
  save(KEYS.courses, courses)
  // Also delete related flashcards
  const flashcards = getFlashcards().filter(f => f.courseId !== id)
  save(KEYS.flashcards, flashcards)
}

// Folders
export function getFolders() { return load(KEYS.folders) }
export function saveFolder(folder) {
  const folders = getFolders()
  const idx = folders.findIndex(f => f.id === folder.id)
  if (idx >= 0) folders[idx] = folder
  else folders.push(folder)
  save(KEYS.folders, folders)
}
export function deleteFolder(id) {
  const folders = getFolders().filter(f => f.id !== id)
  save(KEYS.folders, folders)
  // Move courses out of deleted folder
  const courses = getCourses().map(c => c.folderId === id ? { ...c, folderId: null } : c)
  save(KEYS.courses, courses)
}

// Flashcards
export function getFlashcards() { return load(KEYS.flashcards) }
export function saveFlashcard(fc) {
  const flashcards = getFlashcards()
  const idx = flashcards.findIndex(f => f.id === fc.id)
  if (idx >= 0) flashcards[idx] = fc
  else flashcards.push(fc)
  save(KEYS.flashcards, flashcards)
}
export function deleteFlashcard(id) {
  const flashcards = getFlashcards().filter(f => f.id !== id)
  save(KEYS.flashcards, flashcards)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function generateFlashcardFromCourse(course) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(course.content, 'text/html')
  const text = doc.body.innerText || doc.body.textContent || ''
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const question = course.title || (lines[0] || 'Cours sans titre')
  const answer = lines.slice(1).join('\n') || text.slice(0, 300) || 'Voir le cours pour les détails.'

  return {
    id: generateId(),
    courseId: course.id,
    subjectId: course.subjectId,
    folderId: course.folderId,
    question,
    answer,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
