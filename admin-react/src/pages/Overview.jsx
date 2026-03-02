import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import Skeleton from '../components/Skeleton'

function Overview({ socket, showToast }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animatedStats, setAnimatedStats] = useState({ guilds: 0, members: 0, commands: 0, channels: 0 })
  const [waifuConfig, setWaifuConfig] = useState(null)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchWaifuConfig()
    
    // Listen for real-time updates via WebSocket
    if (socket) {
      socket.on('botStats', (data) => {
        setStats(data)
      })
    }
  }, [socket])

  // Animate numbers counting up
  useEffect(() => {
    if (stats && !loading) {
      const duration = 1500
      const steps = 60
      const interval = duration / steps

      const animate = (key, target) => {
        let current = 0
        const increment = target / steps
        const timer = setInterval(() => {
          current += increment
          if (current >= target) {
            current = target
            clearInterval(timer)
          }
          setAnimatedStats(prev => ({ ...prev, [key]: Math.floor(current) }))
        }, interval)
      }

      animate('guilds', stats.guilds || 0)
      animate('members', stats.members || 0)
      animate('commands', stats.commands || 0)
      animate('channels', stats.channels || 0)
    }
  }, [stats, loading])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/overview-stats`)
      const data = await res.json()
      setStats(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      showToast?.('Failed to load stats', 'error')
      setLoading(false)
    }
  }

  const fetchWaifuConfig = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/waifu-config', {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setWaifuConfig(data.config)
      }
    } catch (err) {
      console.error('Failed to fetch waifu config:', err)
    }
  }

  const saveWaifuConfig = async () => {
    setSavingConfig(true)
    try {
      const res = await fetch('http://localhost:3000/api/waifu-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(waifuConfig)
      })
      const data = await res.json()
      if (data.success) {
        showToast?.('Waifu/Husbando config saved!', 'success')
      } else {
        showToast?.('Failed to save config', 'error')
      }
    } catch (err) {
      console.error('Failed to save config:', err)
      showToast?.('Failed to save config', 'error')
    } finally {
      setSavingConfig(false)
    }
  }

  const updateWaifuValue = (key, value) => {
    setWaifuConfig(prev => ({ ...prev, [key]: parseInt(value) || 0 }))
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time insights into your bot's performance</p>
        </div>
        <div className="stats-grid-compact">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height="140px" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time insights into your bot's performance</p>
        </div>
        <div className="uptime-badge">
          <div className="pulse-dot"></div>
          <span>Uptime: {formatUptime(stats?.uptime || 0)}</span>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="stats-grid-compact">
        <div className="stat-card-compact">
          <div className="stat-icon-wrapper guild-gradient">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value-compact">{formatNumber(animatedStats.guilds)}</div>
            <div className="stat-label-compact">Servers</div>
          </div>
        </div>

        <div className="stat-card-compact">
          <div className="stat-icon-wrapper member-gradient">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="7" r="4"/>
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              <circle cx="17" cy="7" r="2"/>
              <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value-compact">{formatNumber(animatedStats.members)}</div>
            <div className="stat-label-compact">Members</div>
          </div>
        </div>

        <div className="stat-card-compact">
          <div className="stat-icon-wrapper command-gradient">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 6L2 12L8 18"/>
              <path d="M16 6L22 12L16 18"/>
              <path d="M14 4L10 20"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value-compact">{formatNumber(animatedStats.commands)}</div>
            <div className="stat-label-compact">Commands</div>
          </div>
        </div>

        <div className="stat-card-compact">
          <div className="stat-icon-wrapper channel-gradient">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value-compact">{formatNumber(animatedStats.channels)}</div>
            <div className="stat-label-compact">Channels</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title-modern">Quick Actions</h2>
        <div className="action-grid">
          <button className="action-card">
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M7 7h10"/>
                <path d="M7 12h10"/>
                <path d="M7 17h6"/>
              </svg>
            </div>
            <div className="action-content">
              <h3>Send Embed</h3>
              <p>Create and send custom embeds</p>
            </div>
            <div className="action-arrow">→</div>
          </button>

          <button className="action-card">
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 6L2 12L8 18"/>
                <path d="M16 6L22 12L16 18"/>
              </svg>
            </div>
            <div className="action-content">
              <h3>Manage Commands</h3>
              <p>Enable or disable commands</p>
            </div>
            <div className="action-arrow">→</div>
          </button>

          <button className="action-card">
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17v-6"/>
                <path d="M8 17v-4"/>
              </svg>
            </div>
            <div className="action-content">
              <h3>View Analytics</h3>
              <p>Check detailed statistics</p>
            </div>
            <div className="action-arrow">→</div>
          </button>

          <button className="action-card">
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2"/>
                <path d="M12 21v2"/>
                <path d="M4.22 4.22l1.42 1.42"/>
                <path d="M18.36 18.36l1.42 1.42"/>
                <path d="M1 12h2"/>
                <path d="M21 12h2"/>
                <path d="M4.22 19.78l1.42-1.42"/>
                <path d="M18.36 5.64l1.42-1.42"/>
              </svg>
            </div>
            <div className="action-content">
              <h3>Bot Settings</h3>
              <p>Configure bot preferences</p>
            </div>
            <div className="action-arrow">→</div>
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="activity-section">
        <h2 className="section-title-modern">Recent Activity</h2>
        <div className="activity-feed">
          <div className="activity-item">
            <div className="activity-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17L4 12"/>
              </svg>
            </div>
            <div className="activity-content">
              <h4>Bot Started Successfully</h4>
              <p>All systems operational • Just now</p>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
            </div>
            <div className="activity-content">
              <h4>Connected to {stats?.guilds || 0} Servers</h4>
              <p>Serving {formatNumber(stats?.members || 0)} members • 2 minutes ago</p>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
              </svg>
            </div>
            <div className="activity-content">
              <h4>Database Connected</h4>
              <p>MongoDB connection established • 5 minutes ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="system-info-grid">
        <div className="info-card-modern">
          <h3>System Information</h3>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-label">Uptime</span>
              <span className="info-value">{formatUptime(stats?.uptime || 0)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total Commands</span>
              <span className="info-value">{stats?.commands || 0}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total Channels</span>
              <span className="info-value">{stats?.channels || 0}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Latency</span>
              <span className="info-value badge-success">~50ms</span>
            </div>
          </div>
        </div>

        <div className="info-card-modern">
          <h3>Performance Metrics</h3>
          <div className="metric-bars">
            <div className="metric-item">
              <div className="metric-header">
                <span>CPU Usage</span>
                <span>23%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: '23%', background: 'linear-gradient(90deg, #10b981, #059669)' }}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-header">
                <span>Memory</span>
                <span>45%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: '45%', background: 'linear-gradient(90deg, #3b82f6, #2563eb)' }}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-header">
                <span>Network</span>
                <span>12%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: '12%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Waifu/Husbando Configuration */}
        {waifuConfig && (
          <div className="info-card-modern">
            <h3>Waifu/Husbando Configuration</h3>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
              Configure timing and cooldown settings for waifu and husbando claim commands
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '8px' }}>
                  Claim Display Time (ms)
                </label>
                <input
                  type="number"
                  value={waifuConfig.claimDisplayTime}
                  onChange={(e) => updateWaifuValue('claimDisplayTime', e.target.value)}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                  min="1000"
                  step="1000"
                />
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  {(waifuConfig.claimDisplayTime / 1000).toFixed(1)}s
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '8px' }}>
                  Card Lifetime (ms)
                </label>
                <input
                  type="number"
                  value={waifuConfig.cardLifetime}
                  onChange={(e) => updateWaifuValue('cardLifetime', e.target.value)}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                  min="5000"
                  step="1000"
                />
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  {(waifuConfig.cardLifetime / 1000).toFixed(1)}s
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '8px' }}>
                  Collector Timeout (ms)
                </label>
                <input
                  type="number"
                  value={waifuConfig.collectorTime}
                  onChange={(e) => updateWaifuValue('collectorTime', e.target.value)}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                  min="10000"
                  step="1000"
                />
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  {(waifuConfig.collectorTime / 1000).toFixed(1)}s
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '8px' }}>
                  Server Cooldown (ms)
                </label>
                <input
                  type="number"
                  value={waifuConfig.globalCooldown}
                  onChange={(e) => updateWaifuValue('globalCooldown', e.target.value)}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                  min="0"
                  step="1000"
                />
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  {(waifuConfig.globalCooldown / 1000).toFixed(1)}s
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '8px' }}>
                  User Cooldown (ms)
                </label>
                <input
                  type="number"
                  value={waifuConfig.userCooldown}
                  onChange={(e) => updateWaifuValue('userCooldown', e.target.value)}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                  min="0"
                  step="1000"
                />
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  {(waifuConfig.userCooldown / 1000).toFixed(1)}s
                </span>
              </div>
            </div>

            <button
              onClick={saveWaifuConfig}
              disabled={savingConfig}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(90deg, #dc2626, #991b1b)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: savingConfig ? 'not-allowed' : 'pointer',
                opacity: savingConfig ? 0.5 : 1
              }}
            >
              {savingConfig ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Overview
