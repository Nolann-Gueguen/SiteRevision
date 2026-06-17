import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, getToken, setToken } from '../api'

const AuthContext = createContext(null)

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) return null
    return payload.username
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = getToken()
    return token ? decodeToken(token) : null
  })

  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('ss:logout', handler)
    return () => window.removeEventListener('ss:logout', handler)
  }, [])

  const login = async (username, password) => {
    const { token, username: name } = await api.login(username, password)
    setToken(token)
    setUser(name)
    return name
  }

  const register = async (username, password) => {
    const { token, username: name } = await api.register(username, password)
    setToken(token)
    setUser(name)
    return name
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
