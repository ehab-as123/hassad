import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hasad_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hasad_token')
      localStorage.removeItem('hasad_user')
      window.dispatchEvent(new Event('hasad:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export const errorMessage = (error) => {
  const data = error?.response?.data
  if (Array.isArray(data?.errors)) return data.errors.map((item) => item.message || item.msg).join('، ')
  return data?.message || error?.message || 'حدث خطأ غير متوقع'
}
export default api
