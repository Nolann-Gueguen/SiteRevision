import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import SubjectsPage from './pages/SubjectsPage'
import SubjectDetailPage from './pages/SubjectDetailPage'
import ResumesPage from './pages/ResumesPage'
import EvaluationPage from './pages/EvaluationPage'
import './App.css'

const EditorPage = lazy(() => import('./pages/EditorPage'))

function AppRoutes() {
  const { user } = useAuth()

  if (!user) return <LoginPage />

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/matieres" element={<SubjectsPage />} />
          <Route path="/matieres/:subjectId" element={<SubjectDetailPage />} />
          <Route path="/flashcards" element={<ResumesPage />} />
          <Route path="/evaluation" element={<EvaluationPage />} />
          <Route
            path="/editeur"
            element={
              <Suspense fallback={<div className="page-loading">Chargement de l'éditeur…</div>}>
                <EditorPage />
              </Suspense>
            }
          />
          <Route
            path="/editeur/:courseId"
            element={
              <Suspense fallback={<div className="page-loading">Chargement de l'éditeur…</div>}>
                <EditorPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
