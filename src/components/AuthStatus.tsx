import { useEffect, useState } from 'react'
import { useGoogleOneTapLogin, GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useTranslation } from 'react-i18next'
import { useAuthStore, User, Credentials } from '../stores/authStore'

interface GoogleJwtPayload {
  email: string
  name: string
  picture?: string
}

export function AuthStatus() {
  const { t } = useTranslation()
  const { user, isAuthenticated, login, logout } = useAuthStore()
  const [showFallback, setShowFallback] = useState(false)

  const handleCredentialResponse = (credential: string) => {
    const decoded = jwtDecode<GoogleJwtPayload>(credential)
    const userData: User = {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    }
    const credentials: Credentials = { credential }
    login(userData, credentials)
    setShowFallback(false)
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

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm text-gray-700">
          {t('auth.signedInAs', { name: user.name })}
        </span>
        <button
          onClick={logout}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          {t('auth.signOut')}
        </button>
      </div>
    )
  }

  if (showFallback) {
    return (
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
    )
  }

  return null
}
