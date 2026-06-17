import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'studyspace2024'
const SESSION_KEY = 'ss_session'
const CREDS_KEY = 'ss_credentials'

function getStoredCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    return raw ? JSON.parse(raw) : { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD }
  } catch { return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD } }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) || null } catch { return null }
  })

  const login = (username, password) => {
    const creds = getStoredCreds()
    if (username === creds.username && password === creds.password) {
      sessionStorage.setItem(SESSION_KEY, username)
      setUser(username)
      return true
    }
    return false
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
