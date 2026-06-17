const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')
const path = require('path')

const JWT_SECRET = process.env.JWT_SECRET || 'studyspace_jwt_secret_key_2024'
const PORT = process.env.PORT || 3001
const DB_PATH = path.join(__dirname, 'studyspace.db')

// --- Database setup ---
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Migration: add columns that may be missing from older DB versions
try { db.exec(`ALTER TABLE courses ADD COLUMN summary TEXT DEFAULT ''`) } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS folders (
    id         TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    subject_id TEXT    NOT NULL,
    ord        INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS courses (
    id         TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT    NOT NULL DEFAULT '',
    subject_id TEXT    NOT NULL DEFAULT '',
    folder_id  TEXT    REFERENCES folders(id) ON DELETE SET NULL,
    content    TEXT    DEFAULT '',
    summary    TEXT    DEFAULT '',
    ord        INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id         TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id  TEXT    REFERENCES courses(id) ON DELETE CASCADE,
    subject_id TEXT,
    folder_id  TEXT,
    question   TEXT    NOT NULL DEFAULT '',
    answer     TEXT    DEFAULT '',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
`)

// --- Express setup ---
const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

// --- Auth middleware ---
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' })
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter.' })
  }
}

function mapCourse(c) {
  return {
    id: c.id, title: c.title, subjectId: c.subject_id,
    folderId: c.folder_id, content: c.content, summary: c.summary || '',
    order: c.ord, createdAt: c.created_at * 1000, updatedAt: c.updated_at * 1000,
  }
}
function mapFolder(f) {
  return { id: f.id, name: f.name, subjectId: f.subject_id, order: f.ord }
}
function mapFlashcard(f) {
  return {
    id: f.id, courseId: f.course_id, subjectId: f.subject_id,
    folderId: f.folder_id, question: f.question, answer: f.answer,
    createdAt: f.created_at * 1000, updatedAt: f.updated_at * 1000,
  }
}

// --- Auth routes ---
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body || {}
  if (!username?.trim() || !password?.trim())
    return res.status(400).json({ error: 'Identifiant et mot de passe requis.' })
  if (password.length < 4)
    return res.status(400).json({ error: 'Mot de passe trop court (4 caractères min.).' })
  const hash = bcrypt.hashSync(password, 10)
  try {
    const r = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username.trim(), hash)
    const token = jwt.sign({ id: r.lastInsertRowid, username: username.trim() }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, username: username.trim() })
  } catch {
    res.status(409).json({ error: 'Cet identifiant est déjà pris.' })
  }
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username?.trim())
  if (!user || !bcrypt.compareSync(password || '', user.password_hash))
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' })
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, username: user.username })
})

// --- Courses ---
app.get('/api/courses', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM courses WHERE user_id = ? ORDER BY ord ASC, updated_at DESC').all(req.user.id)
  res.json(rows.map(mapCourse))
})

app.get('/api/courses/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!row) return res.status(404).json({ error: 'Cours introuvable.' })
  res.json(mapCourse(row))
})

app.post('/api/courses', auth, (req, res) => {
  const { id, title, subjectId, folderId, content, summary, order } = req.body
  db.prepare(`
    INSERT INTO courses (id, user_id, title, subject_id, folder_id, content, summary, ord)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, subject_id=excluded.subject_id,
      folder_id=excluded.folder_id, content=excluded.content,
      summary=excluded.summary, ord=excluded.ord, updated_at=unixepoch()
    WHERE courses.user_id = ?
  `).run(id, req.user.id, title || '', subjectId || '', folderId || null, content || '', summary || '', order || 0, req.user.id)
  res.json({ ok: true })
})

app.delete('/api/courses/:id', auth, (req, res) => {
  db.prepare('DELETE FROM courses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// --- Folders ---
app.get('/api/folders', auth, (req, res) => {
  const { subjectId } = req.query
  const rows = subjectId
    ? db.prepare('SELECT * FROM folders WHERE user_id = ? AND subject_id = ? ORDER BY ord ASC').all(req.user.id, subjectId)
    : db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY ord ASC').all(req.user.id)
  res.json(rows.map(mapFolder))
})

app.post('/api/folders', auth, (req, res) => {
  const { id, name, subjectId, order } = req.body
  db.prepare(`
    INSERT INTO folders (id, user_id, name, subject_id, ord)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, ord=excluded.ord
    WHERE folders.user_id = ?
  `).run(id, req.user.id, name || '', subjectId || '', order || 0, req.user.id)
  res.json({ ok: true })
})

app.delete('/api/folders/:id', auth, (req, res) => {
  db.prepare('UPDATE courses SET folder_id = NULL WHERE folder_id = ? AND user_id = ?').run(req.params.id, req.user.id)
  db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// --- Flashcards ---
app.get('/api/flashcards', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM flashcards WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  res.json(rows.map(mapFlashcard))
})

app.post('/api/flashcards', auth, (req, res) => {
  const { id, courseId, subjectId, folderId, question, answer } = req.body
  db.prepare(`
    INSERT INTO flashcards (id, user_id, course_id, subject_id, folder_id, question, answer)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      question=excluded.question, answer=excluded.answer,
      subject_id=excluded.subject_id, updated_at=unixepoch()
    WHERE flashcards.user_id = ?
  `).run(id, req.user.id, courseId || null, subjectId || null, folderId || null, question || '', answer || '', req.user.id)
  res.json({ ok: true })
})

app.delete('/api/flashcards/:id', auth, (req, res) => {
  db.prepare('DELETE FROM flashcards WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// --- Start ---
app.listen(PORT, () => {
  console.log(`✓  API StudySpace démarrée sur http://localhost:${PORT}`)
})
