import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hasad_user')) } catch { return null }
  })
  const [ready, setReady] = useState(false)

  const saveSession = (data) => {
    localStorage.setItem('hasad_token', data.token)
    localStorage.setItem('hasad_user', JSON.stringify(data.user))
    setUser(data.user)
  }
  const login = async (payload) => saveSession((await api.post('/auth/login', payload)).data)
  const register = async (payload) => saveSession((await api.post('/auth/register', payload)).data)
  const logout = () => {
    localStorage.removeItem('hasad_token')
    localStorage.removeItem('hasad_user')
    setUser(null)
  }

  useEffect(() => {
    const verify = async () => {
      if (localStorage.getItem('hasad_token')) {
        try {
          const { data } = await api.get('/auth/me')
          setUser(data.user)
          localStorage.setItem('hasad_user', JSON.stringify(data.user))
        } catch { logout() }
      }
      setReady(true)
    }
    verify()
    const onUnauthorized = () => logout()
    window.addEventListener('hasad:unauthorized', onUnauthorized)
    return () => window.removeEventListener('hasad:unauthorized', onUnauthorized)
  }, [])

  return <AuthContext.Provider value={{ user, ready, login, register, logout }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
