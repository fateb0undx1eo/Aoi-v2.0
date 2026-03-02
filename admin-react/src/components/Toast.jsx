import { useEffect } from 'react'

function Toast({ message, type = 'info', show, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!show) return;
    
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [show, duration, onClose])

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )
      case 'error':
        return (
          <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        )
      case 'info':
      default:
        return (
          <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        )
    }
  }

  return (
    <div className="toast-container">
      <div className={`toast ${type}`}>
        {getIcon()}
        <div className="toast-content">
          <div className="toast-message">{message}</div>
        </div>
        <button className="toast-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Toast
