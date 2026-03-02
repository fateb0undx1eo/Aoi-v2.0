import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'
import { API_URL, SOCKET_URL } from './config'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Commands from './pages/Commands'
import EmbedMessages from './pages/EmbedMessages'
import Statistics from './pages/Statistics'
import AutoResponder from './pages/AutoResponder'
import Toast from './components/Toast'
import HackingTerminal from './components/HackingTerminal'

function App() {
  const [currentPage, setCurrentPage] = useState('overview')
  const [botInfo, setBotInfo] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [socket, setSocket] = useState(null)
  const [toast, setToast] = useState(null)
  const [showTerminal, setShowTerminal] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Initialize WebSocket after authentication
  useEffect(() => {
    if (isAuthenticated && !socket) {
      const token = localStorage.getItem('authToken')
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      })

      newSocket.on('connect', () => {
        console.log('WebSocket connected')
      })

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
      })

      newSocket.on('botStats', (data) => {
        // Stats will be handled by individual pages
        console.log('Bot stats updated:', data)
      })

      newSocket.on('prefixUpdate', (data) => {
        showToast('Prefix updated to: ' + data.prefix, 'success')
      })

      newSocket.on('commandToggle', (data) => {
        showToast(`Command ${data.commandName} ${data.disabled ? 'disabled' : 'enabled'}`, 'success')
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [isAuthenticated])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setIsAuthenticated(false)
        setIsCheckingAuth(false)
        return
      }
      
      const res = await fetch(`${API_URL}/api/check-auth`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        fetchBotInfo()
      } else {
        localStorage.removeItem('authToken')
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      setIsAuthenticated(false)
      localStorage.removeItem('authToken')
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const fetchBotInfo = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_URL}/api/bot-info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setBotInfo(data)
    } catch (err) {
      console.error('Failed to fetch bot info:', err)
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const handleLogin = () => {
    setShowTerminal(true)
  }

  const handleTerminalComplete = () => {
    setShowTerminal(false)
    setIsAuthenticated(true)
    fetchBotInfo()
  }

  const handleTerminalDelete = () => {
    // Redirect to the image
    window.location.href = 'https://i.imgur.com/9unfFH5.gif'
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken')
      await fetch(`${API_URL}/api/logout`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      localStorage.removeItem('authToken')
      setIsAuthenticated(false)
      setBotInfo(null)
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        {showTerminal ? (
          <HackingTerminal 
            onComplete={handleTerminalComplete} 
            onDelete={handleTerminalDelete}
          />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </>
    )
  }

  const renderPage = () => {
    // Sharp cut page transitions
    const pageVariants = {
      initial: { 
        opacity: 0,
        x: 20,
        scale: 0.98
      },
      animate: { 
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
          duration: 0.2,
          ease: [0.25, 0.1, 0.25, 1]
        }
      },
      exit: { 
        opacity: 0,
        x: -20,
        scale: 0.98,
        transition: {
          duration: 0.15,
          ease: [0.25, 0.1, 0.25, 1]
        }
      }
    }

    const pages = {
      'overview': <Overview socket={socket} showToast={showToast} />,
      'commands': <Commands socket={socket} showToast={showToast} />,
      'embed-messages': <EmbedMessages showToast={showToast} />,
      'autoresponder': <AutoResponder showToast={showToast} />,
      'statistics': <Statistics socket={socket} showToast={showToast} />
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {pages[currentPage] || pages['overview']}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="top-navbar">
        <div className="navbar-left">
          {botInfo && (
            <>
              <img src={botInfo.botAvatar} alt="Bot" className="navbar-bot-avatar" />
              <div className="navbar-bot-info">
                <h2>{botInfo.botName}</h2>
                <span className={`status-dot ${botInfo.botStatus}`}></span>
              </div>
            </>
          )}
        </div>

        <nav className="navbar-center">
          <button 
            className={`nav-link ${currentPage === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentPage('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-link ${currentPage === 'statistics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('statistics')}
          >
            Statistics
          </button>
          <button 
            className={`nav-link ${currentPage === 'commands' ? 'active' : ''}`}
            onClick={() => setCurrentPage('commands')}
          >
            Commands
          </button>
          <button 
            className={`nav-link ${currentPage === 'embed-messages' ? 'active' : ''}`}
            onClick={() => setCurrentPage('embed-messages')}
          >
            Embed Messages
          </button>
          <button 
            className={`nav-link ${currentPage === 'autoresponder' ? 'active' : ''}`}
            onClick={() => setCurrentPage('autoresponder')}
          >
            Auto Responder
          </button>
        </nav>

        <div className="navbar-right">
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <path d="M16 17l5-5-5-5"/>
              <path d="M21 12H9"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {renderPage()}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
