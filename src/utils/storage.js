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
