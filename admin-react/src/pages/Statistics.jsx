import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import Skeleton from '../components/Skeleton'

function Statistics({ socket, showToast }) {
  const [stats, setStats] = useState(null)
  const [systemData, setSystemData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Update every 5 seconds
    
    // Listen for real-time updates
    if (socket) {
      socket.on('botStats', (data) => {
        setStats(data)
      })
    }

    return () => clearInterval(interval)
  }, [socket])

  const fetchData = async () => {
    try {
      const [statsRes, systemRes] = await Promise.all([
        fetch(`${API_URL}/api/bot-stats`),
        fetch(`${API_URL}/api/bot-data2`)
      ])
      const statsData = await statsRes.json()
      const systemDataRes = await systemRes.json()
      
      setStats(statsData)
      setSystemData(systemDataRes)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      showToast?.('Failed to load statistics', 'error')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Statistics</h1>
        <p className="page-subtitle">Monitor your bot's performance and system health</p>
        <div className="stats-overview">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height="150px" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Statistics</h1>
      <p className="page-subtitle">Monitor your bot's performance and system health</p>

      <div className="stats-overview">
        <div className="stat-card large">
          <h3>
            <svg style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
            Total Servers
          </h3>
          <div className="stat-value-large">{stats?.totalServers || 0}</div>
        </div>
        <div className="stat-card large">
          <h3>
            <svg style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="7" r="4"/>
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              <circle cx="17" cy="7" r="2"/>
              <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
            Total Users
          </h3>
          <div className="stat-value-large">{stats?.totalUsers?.toLocaleString() || 0}</div>
        </div>
        <div className="stat-card large">
          <h3>
            <svg style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 6L2 12L8 18"/>
              <path d="M16 6L22 12L16 18"/>
            </svg>
            Total Commands
          </h3>
          <div className="stat-value-large">{stats?.totalCommands || 0}</div>
        </div>
      </div>

      <div className="system-health">
        <h2 className="section-title">
          <svg style={{ width: '24px', height: '24px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          System Health
        </h2>
        
        <div className="health-grid">
          <div className="health-card">
            <div className="health-header">
              <h3>
                <svg style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
                Database Connection
              </h3>
              <span className={`status-indicator ${systemData?.connections?.database?.status === 'Active' ? 'active' : 'inactive'}`}>
                {systemData?.connections?.database?.status || 'Unknown'}
              </span>
            </div>
          </div>

          <div className="health-card">
            <div className="health-header">
              <h3>
                <svg style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                WebSocket Connection
              </h3>
              <span className={`status-indicator ${systemData?.connections?.websocket?.status === 'Stable' ? 'active' : 'inactive'}`}>
                {systemData?.connections?.websocket?.status || 'Unknown'}
              </span>
            </div>
          </div>

          <div className="health-card">
            <div className="health-header">
              <h3>
                <svg style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8"/>
                  <path d="M12 17v4"/>
                </svg>
                Memory Usage
              </h3>
              <span className="memory-stats">
                {systemData?.memory?.used || 0} MB / {systemData?.memory?.total || 0} MB
              </span>
            </div>
            <div className="memory-bar">
              <div 
                className="memory-fill" 
                style={{ 
                  width: `${((systemData?.memory?.used || 0) / (systemData?.memory?.total || 1)) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="system-status">
          <div className={`status-message ${systemData?.systemStatus?.operational ? 'operational' : 'degraded'}`}>
            <svg style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {systemData?.systemStatus?.operational ? (
                <path d="M20 6L9 17L4 12"/>
              ) : (
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              )}
            </svg>
            {systemData?.systemStatus?.message || 'Unknown status'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
