const TOKEN_KEY = 'ss_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

async function req(path, opts = {}) {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 401) {
    setToken(null)
    window.dispatchEvent(new CustomEvent('ss:logout'))
    throw new Error('Session expirée. Veuillez vous reconnecter.')
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Impossible de joindre le serveur. Vérifiez que le backend est démarré (npm run dev:all).')
  }
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export const api = {
  // Auth
  login:    (username, password) => req('/auth/login',    { method: 'POST', body: { username, password } }),
  register: (username, password) => req('/auth/register', { method: 'POST', body: { username, password } }),

  // Courses
  getCourses:   ()           => req('/courses'),
  getCourse:    (id)         => req(`/courses/${id}`),
  saveCourse:   (course)     => req('/courses',     { method: 'POST',   body: course }),
  deleteCourse: (id)         => req(`/courses/${id}`, { method: 'DELETE' }),

  // Folders
  getFolders:   (subjectId)  => req(`/folders${subjectId ? `?subjectId=${subjectId}` : ''}`),
  saveFolder:   (folder)     => req('/folders',     { method: 'POST',   body: folder }),
  deleteFolder: (id)         => req(`/folders/${id}`, { method: 'DELETE' }),

  // Flashcards
  getFlashcards:   ()    => req('/flashcards'),
  saveFlashcard:   (fc)  => req('/flashcards',     { method: 'POST',   body: fc }),
  deleteFlashcard: (id)  => req(`/flashcards/${id}`, { method: 'DELETE' }),
}
