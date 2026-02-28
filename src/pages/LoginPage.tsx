import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGoogleOneTapLogin, GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useTranslation } from 'react-i18next'
import { useAuthStore, User } from '../stores/authStore'

interface GoogleJwtPayload {
  email: string
  name: string
  picture?: string
}

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuthStore()
  const [showFallback, setShowFallback] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/transactions'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleCredentialResponse = (credential: string) => {
    const decoded = jwtDecode<GoogleJwtPayload>(credential)
    const userData: User = {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    }
    login(userData, { credential })
    setShowFallback(false)
    navigate(from, { replace: true })
  }

  useGoogleOneTapLogin({
    onSuccess: (response) => {
      if (response.credential) {
        handleCredentialResponse(response.credential)
      }
    },
    onError: () => {
      setShowFallback(true)
    },
    disabled: isAuthenticated,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setShowFallback(true)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
          {t('login.title')}
        </h1>
        <p className="mb-8 text-center text-gray-600">{t('login.tagline')}</p>
        {showFallback && (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(response) => {
                if (response.credential) {
                  handleCredentialResponse(response.credential)
                }
              }}
              onError={() => {
                console.error('Google login failed')
              }}
              text="signin_with"
              shape="rectangular"
            />
          </div>
        )}
      </div>
    </div>
  )
}
