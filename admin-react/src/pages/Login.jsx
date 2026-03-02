import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { API_URL } from '../config'
import ThreeBackground from '../components/ThreeBackground'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const cardRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    const handleMouseMove = (e) => {
      if (isMobile || !cardRef.current) return
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (cardRef.current) {
          const card = cardRef.current
          const rect = card.getBoundingClientRect()
          const cardCenterX = rect.left + rect.width / 2
          const cardCenterY = rect.top + rect.height / 2
          
          // Calculate distance from center
          const deltaX = e.clientX - cardCenterX
          const deltaY = e.clientY - cardCenterY
          
          // Calculate distance from card center
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          const maxDistance = 400 // Only tilt when mouse is within 400px of card center
          
          // If mouse is too far, reset tilt smoothly
          if (distance > maxDistance) {
            setCardTilt({ x: 0, y: 0 })
            return
          }
          
          // Smooth tilt with reduced intensity and clamping
          const intensity = 0.015 // Reduced from 8 degrees to much gentler
          const maxTilt = 3 // Maximum 3 degrees tilt
          
          let tiltX = -deltaY * intensity
          let tiltY = deltaX * intensity
          
          // Clamp values
          tiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX))
          tiltY = Math.max(-maxTilt, Math.min(maxTilt, tiltY))
          
          setCardTilt({ x: tiltX, y: tiltY })
        }
      })
    }

    const handleOrientation = (e) => {
      if (!isMobile) return
      
      const beta = e.beta || 0
      const gamma = e.gamma || 0
      
      const tiltX = Math.max(-8, Math.min(8, beta / 10))
      const tiltY = Math.max(-8, Math.min(8, gamma / 10))
      
      setCardTilt({ x: tiltX, y: tiltY })
    }

    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission()
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, { passive: true })
          }
        } catch (error) {
          console.log('Device orientation permission denied')
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation, { passive: true })
      }
    }

    if (isMobile) {
      requestPermission()
    } else {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('deviceorientation', handleOrientation)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isMobile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token)
        onLogin()
      } else {
        setError(data.message || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container-premium">
      <ThreeBackground />
      <div className="login-bg-gradient"></div>
      <div className="login-bg-pattern"></div>
      
      {/* Rising Ember Particles */}
      <div className="login-embers">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="ember" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      <motion.div 
        ref={cardRef}
        className="login-card-premium"
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          rotateX: cardTilt.x,
          rotateY: cardTilt.y
        }}
        transition={{ 
          opacity: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
          y: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
          rotateX: { type: "spring", stiffness: 100, damping: 15 },
          rotateY: { type: "spring", stiffness: 100, damping: 15 }
        }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: 1000
        }}
      >
        <div className="login-card-glow"></div>
        
        <div className="login-header-premium">
          <motion.div 
            className="login-logo-premium"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="logo-ring"></div>
            <div className="logo-ring-inner"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </motion.div>
          <motion.h1 
            className="login-title-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            className="login-subtitle-premium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Sign in to access your dashboard
          </motion.p>
        </div>

        <form className="login-form-premium" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error-premium">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group-premium">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Username
            </label>
            <div className={`input-wrapper-premium ${focusedInput === 'username' ? 'focused' : ''}`}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group-premium">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Password
            </label>
            <div className={`input-wrapper-premium ${focusedInput === 'password' ? 'focused' : ''}`}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <motion.button 
            type="submit" 
            className="btn-login-premium" 
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="btn-content">
              {loading ? (
                <>
                  <div className="spinner-premium"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14"/>
                    <path d="M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </span>
            <div className="btn-shine"></div>
          </motion.button>
        </form>

        <div className="login-footer-premium">
          <div className="security-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Secure Connection</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
