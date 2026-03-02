import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import Skeleton from '../components/Skeleton'

function Commands({ socket, showToast }) {
  const [commands, setCommands] = useState({ slash: [], prefix: [] })
  const [activeTab, setActiveTab] = useState('slash')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [prefix, setPrefix] = useState('!')
  const [newPrefix, setNewPrefix] = useState('!')
  const [updatingPrefix, setUpdatingPrefix] = useState(false)

  useEffect(() => {
    fetchCommands()
    fetchPrefix()

    // Listen for real-time updates
    if (socket) {
      socket.on('commandToggle', (data) => {
        setCommands(prev => ({
          slash: prev.slash.map(cmd => 
            cmd.name === data.commandName ? { ...cmd, disabled: data.disabled } : cmd
          ),
          prefix: prev.prefix.map(cmd => 
            cmd.name === data.commandName ? { ...cmd, disabled: data.disabled } : cmd
          )
        }))
      })

      socket.on('prefixUpdate', (data) => {
        setPrefix(data.prefix)
        setNewPrefix(data.prefix)
      })
    }
  }, [socket])

  const fetchCommands = async () => {
    try {
      const res = await fetch(`${API_URL}/api/commands`)
      const data = await res.json()
      setCommands(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch commands:', err)
      showToast?.('Failed to load commands', 'error')
      setLoading(false)
    }
  }

  const fetchPrefix = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_URL}/api/prefix`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.prefix) {
        setPrefix(data.prefix)
        setNewPrefix(data.prefix)
      }
    } catch (err) {
      console.error('Failed to fetch prefix:', err)
    }
  }

  const updatePrefix = async () => {
    if (!newPrefix || newPrefix === prefix) return
    
    setUpdatingPrefix(true)
    try {
      const res = await fetch(`${API_URL}/api/prefix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: newPrefix })
      })
      const data = await res.json()
      
      if (data.success) {
        setPrefix(newPrefix)
        showToast?.(`Prefix updated to: ${newPrefix}`, 'success')
      } else {
        showToast?.(data.message || 'Failed to update prefix', 'error')
      }
    } catch (err) {
      console.error('Failed to update prefix:', err)
      showToast?.('Failed to update prefix', 'error')
    }
    setUpdatingPrefix(false)
  }

  const toggleCommand = async (commandName, currentDisabled) => {
    setToggling(commandName)
    try {
      const res = await fetch(`${API_URL}/api/commands/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandName,
          disabled: !currentDisabled
        })
      })
      const data = await res.json()
      if (data.success) {
        setCommands(prev => ({
          slash: prev.slash.map(cmd => 
            cmd.name === commandName ? { ...cmd, disabled: !currentDisabled } : cmd
          ),
          prefix: prev.prefix.map(cmd => 
            cmd.name === commandName ? { ...cmd, disabled: !currentDisabled } : cmd
          )
        }))
        showToast?.(`Command ${commandName} ${!currentDisabled ? 'disabled' : 'enabled'}`, 'success')
      } else {
        showToast?.(data.message || 'Failed to toggle command', 'error')
      }
    } catch (err) {
      console.error('Failed to toggle command:', err)
      showToast?.('Failed to toggle command', 'error')
    }
    setToggling(null)
  }

  const currentCommands = commands[activeTab]
  const categories = ['all', ...new Set(currentCommands.map(cmd => cmd.category || 'General'))]
  
  const filteredCommands = currentCommands.filter(cmd => {
    const matchesSearch = cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cmd.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const enabledCount = filteredCommands.filter(cmd => !cmd.disabled).length
  const disabledCount = filteredCommands.filter(cmd => cmd.disabled).length

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Commands</h1>
        <p className="page-subtitle">Manage and configure all bot commands</p>
        <div className="commands-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} height="150px" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Commands</h1>
      <p className="page-subtitle">Manage and configure all bot commands</p>

      {/* Prefix Management */}
      <div className="config-card" style={{ marginBottom: '32px' }}>
        <h3>
          <svg style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5"/>
            <line x1="12" y1="19" x2="20" y2="19"/>
          </svg>
          Command Prefix
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Current Prefix: {prefix}</label>
            <input
              type="text"
              value={newPrefix}
              onChange={(e) => setNewPrefix(e.target.value)}
              placeholder="Enter new prefix"
              maxLength={5}
              style={{ maxWidth: '200px' }}
            />
          </div>
          <button 
            className="btn-primary"
            onClick={updatePrefix}
            disabled={updatingPrefix || !newPrefix || newPrefix === prefix}
            style={{ marginTop: '20px' }}
          >
            {updatingPrefix ? (
              <>
                <div className="spinner-small"></div>
                Updating...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Update Prefix
              </>
            )}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'slash' ? 'active' : ''}`}
          onClick={() => setActiveTab('slash')}
        >
          <span className="tab-icon">/</span>
          Slash Commands
          <span className="badge">{commands.slash.length}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'prefix' ? 'active' : ''}`}
          onClick={() => setActiveTab('prefix')}
        >
          <span className="tab-icon">#</span>
          Prefix Commands
          <span className="badge">{commands.prefix.length}</span>
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search commands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filter">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="stats">
          <span className="stat enabled">
            <span className="dot"></span>
            {enabledCount} Enabled
          </span>
          <span className="stat disabled">
            <span className="dot"></span>
            {disabledCount} Disabled
          </span>
        </div>
      </div>

      <div className="commands-grid">
        {filteredCommands.length === 0 ? (
          <div className="empty-state">
            <p>No commands found</p>
          </div>
        ) : (
          filteredCommands.map((cmd) => (
            <div 
              key={cmd.name} 
              className={`command-card ${cmd.disabled ? 'disabled' : ''}`}
            >
              <div className="command-header">
                <div>
                  <h3 className="command-name">/{cmd.name}</h3>
                  <span className="command-category">{cmd.category || 'General'}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={!cmd.disabled}
                    onChange={() => toggleCommand(cmd.name, cmd.disabled)}
                    disabled={toggling === cmd.name}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <p className="command-description">
                {cmd.description || 'No description'}
              </p>
              <div className="command-footer">
                <span className={`status-badge ${cmd.disabled ? 'off' : 'on'}`}>
                  {cmd.disabled ? 'Disabled' : 'Active'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Commands
