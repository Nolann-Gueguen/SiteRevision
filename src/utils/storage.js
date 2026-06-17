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

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }
function low(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : '' }

export function generateFlashcardFromCourse(course) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(course.content, 'text/html')
  const raw = doc.body.innerText || doc.body.textContent || ''

  // Split into sentences
  const sentences = raw
    .split(/(?<=[.!?])\s+|\n/)
    .map(s => s.trim())
    .filter(s => s.length > 8)

  let question = ''
  let answer = ''

  for (const line of sentences) {
    // "X parce que Y" / "X parce qu'Y"
    const pq = line.match(/^(.+?)\s+parce\s+qu[e'](.+)$/i)
    if (pq) {
      question = cap(`Pourquoi ${low(pq[1].trim())} ?`)
      answer   = cap(`Parce que ${low(pq[2].trim())}`)
      break
    }
    // "X car Y"
    const car = line.match(/^(.+?)\s+car\s+(.+)$/i)
    if (car) {
      question = cap(`Pourquoi ${low(car[1].trim())} ?`)
      answer   = cap(`Car ${low(car[2].trim())}`)
      break
    }
    // "X est/sont/représente/désigne Y" (sujet court)
    const est = line.match(/^([^,]{3,45}?)\s+(est|sont|s'appelle(?:nt)?|représente(?:nt)?|désigne(?:nt)?)\s+(.+)$/i)
    if (est && est[1].trim().split(' ').length <= 5) {
      question = cap(`Qu'est-ce que ${low(est[1].trim())} ?`)
      answer   = cap(`${est[1].trim()} ${est[2]} ${est[3].trim()}`)
      break
    }
    // "X : Y"
    const colon = line.match(/^([^:]{2,45})\s*:\s*(.+)$/)
    if (colon && colon[1].trim().split(' ').length <= 6) {
      question = cap(`${colon[1].trim()} ?`)
      answer   = cap(colon[2].trim())
      break
    }
  }

  // Fallback : titre comme question, contenu comme réponse
  if (!question) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
    question = course.title || lines[0] || 'Cours sans titre'
    answer   = lines.slice(1).join('\n') || raw.slice(0, 400) || 'Voir le cours pour les détails.'
  }

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

// Extrait les points clés d'un cours pour les fiches de révision
export function generateSummaryHTML(content) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  const parts = []

  for (const el of doc.body.children) {
    const tag = el.tagName
    if (/^H[1-6]$/.test(tag)) {
      parts.push(el.outerHTML)
    } else if (tag === 'UL' || tag === 'OL') {
      parts.push(el.outerHTML)
    } else if (tag === 'BLOCKQUOTE') {
      parts.push(el.outerHTML)
    } else if (tag === 'HR') {
      parts.push('<hr>')
    } else if (tag === 'P') {
      const text = el.textContent.trim()
      if (!text || text === 'Commencez à écrire votre cours ici...') continue
      // On garde si contient du texte mis en valeur (gras, italique, surligné...)
      if (el.querySelector('strong, em, mark, u, s')) {
        parts.push(el.outerHTML)
      } else if (text.split(/\s+/).length <= 30) {
        // Phrases courtes = probablement une info clé
        parts.push(el.outerHTML)
      }
    }
  }

  if (parts.length === 0) {
    const text = doc.body.textContent.trim()
    if (!text || text === 'Commencez à écrire votre cours ici...') return '<p><em>Aucun contenu.</em></p>'
    return `<p>${text.slice(0, 600)}${text.length > 600 ? '…' : ''}</p>`
  }

  return parts.join('\n')
}
