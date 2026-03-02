import { useState, useEffect } from 'react'
import { API_URL } from '../config'

function EmbedMessages({ showToast }) {
  const [guilds, setGuilds] = useState([])
  const [channels, setChannels] = useState([])
  const [selectedGuild, setSelectedGuild] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  
  const [embed, setEmbed] = useState({
    title: '',
    description: '',
    color: '#7c3aed',
    footer: '',
    footerIcon: '',
    thumbnail: '',
    image: '',
    author: '',
    authorIcon: '',
    url: '',
    fields: [],
    useTimestamp: false
  })

  useEffect(() => {
    fetchGuilds()
  }, [])

  useEffect(() => {
    if (selectedGuild) {
      fetchChannels(selectedGuild)
    } else {
      setChannels([])
      setSelectedChannel('')
    }
  }, [selectedGuild])

  const fetchGuilds = async () => {
    try {
      const res = await fetch(`${API_URL}/api/guilds`)
      const data = await res.json()
      setGuilds(data)
    } catch (err) {
      console.error('Failed to fetch guilds:', err)
      showToast?.('Failed to load guilds', 'error')
    }
  }

  const fetchChannels = async (guildId) => {
    setLoadingChannels(true)
    try {
      const res = await fetch(`/api/channels/${guildId}`)
      const data = await res.json()
      setChannels(data)
    } catch (err) {
      console.error('Failed to fetch channels:', err)
      showToast?.('Failed to load channels', 'error')
    }
    setLoadingChannels(false)
  }

  const handleSendEmbed = async (e) => {
    e.preventDefault()
    
    if (!selectedChannel) {
      showToast?.('Please select a channel', 'error')
      return
    }

    setSending(true)

    const embedData = {
      title: embed.title || undefined,
      description: embed.description || undefined,
      color: parseInt(embed.color.replace('#', ''), 16),
      footer: embed.footer ? { 
        text: embed.footer,
        icon_url: embed.footerIcon || undefined
      } : undefined,
      thumbnail: embed.thumbnail ? { url: embed.thumbnail } : undefined,
      image: embed.image ? { url: embed.image } : undefined,
      author: embed.author ? { 
        name: embed.author,
        icon_url: embed.authorIcon || undefined
      } : undefined,
      url: embed.url || undefined,
      fields: embed.fields.length > 0 ? embed.fields : undefined,
      timestamp: embed.useTimestamp ? new Date().toISOString() : undefined
    }

    try {
      const res = await fetch(`${API_URL}/api/send-embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannel,
          embed: embedData
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showToast?.('Embed sent successfully!', 'success')
      } else {
        showToast?.(data.message || 'Failed to send embed', 'error')
      }
    } catch (err) {
      showToast?.('Failed to send embed', 'error')
      console.error(err)
    }
    setSending(false)
  }

  const updateEmbed = (field, value) => {
    setEmbed(prev => ({ ...prev, [field]: value }))
  }

  const addField = () => {
    setEmbed(prev => ({
      ...prev,
      fields: [...prev.fields, { name: '', value: '', inline: false }]
    }))
  }

  const updateField = (index, key, value) => {
    setEmbed(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, [key]: value } : field
      )
    }))
  }

  const removeField = (index) => {
    setEmbed(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const colorPresets = [
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' }
  ]

  return (
    <div className="page-container">
      <h1 className="page-title">Embed Builder</h1>
      <p className="page-subtitle">Create beautiful, rich embed messages for your Discord channels</p>

      <div className="embed-builder-container">
        <div className="embed-editor">
          <div className="editor-header">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Editor
            </h3>
          </div>

          <div className="editor-tabs">
            <button 
              className={`editor-tab ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              Content
            </button>
            <button 
              className={`editor-tab ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              Images
            </button>
            <button 
              className={`editor-tab ${activeTab === 'fields' ? 'active' : ''}`}
              onClick={() => setActiveTab('fields')}
            >
              Fields
            </button>
            <button 
              className={`editor-tab ${activeTab === 'send' ? 'active' : ''}`}
              onClick={() => setActiveTab('send')}
            >
              Send
            </button>
          </div>

          <div className="editor-content">
            {activeTab === 'content' && (
              <div className="tab-panel">
                <div className="form-group">
                  <label>Author Name</label>
                  <input 
                    type="text" 
                    value={embed.author}
                    onChange={(e) => updateEmbed('author', e.target.value)}
                    placeholder="Author name"
                    maxLength={256}
                  />
                </div>

                <div className="form-group">
                  <label>Author Icon URL</label>
                  <input 
                    type="url" 
                    value={embed.authorIcon}
                    onChange={(e) => updateEmbed('authorIcon', e.target.value)}
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                <div className="form-group">
                  <label>Title</label>
                  <input 
                    type="text" 
                    value={embed.title}
                    onChange={(e) => updateEmbed('title', e.target.value)}
                    placeholder="Embed title"
                    maxLength={256}
                  />
                </div>

                <div className="form-group">
                  <label>Title URL</label>
                  <input 
                    type="url" 
                    value={embed.url}
                    onChange={(e) => updateEmbed('url', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={embed.description}
                    onChange={(e) => updateEmbed('description', e.target.value)}
                    placeholder="Embed description"
                    rows={6}
                    maxLength={4096}
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker">
                    <div className="color-presets">
                      {colorPresets.map(preset => (
                        <button
                          key={preset.value}
                          className={`color-preset ${embed.color === preset.value ? 'active' : ''}`}
                          style={{ backgroundColor: preset.value }}
                          onClick={() => updateEmbed('color', preset.value)}
                          title={preset.name}
                        />
                      ))}
                    </div>
                    <div className="color-input-group">
                      <input 
                        type="color" 
                        value={embed.color}
                        onChange={(e) => updateEmbed('color', e.target.value)}
                      />
                      <input 
                        type="text" 
                        value={embed.color}
                        onChange={(e) => updateEmbed('color', e.target.value)}
                        placeholder="#7c3aed"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Footer Text</label>
                  <input 
                    type="text" 
                    value={embed.footer}
                    onChange={(e) => updateEmbed('footer', e.target.value)}
                    placeholder="Footer text"
                    maxLength={2048}
                  />
                </div>

                <div className="form-group">
                  <label>Footer Icon URL</label>
                  <input 
                    type="url" 
                    value={embed.footerIcon}
                    onChange={(e) => updateEmbed('footerIcon', e.target.value)}
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={embed.useTimestamp}
                      onChange={(e) => updateEmbed('useTimestamp', e.target.checked)}
                    />
                    <span>Include Timestamp</span>
                  </label>
                  <p className="help-text">Add current date/time to the embed footer</p>
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="tab-panel">
                <div className="form-group">
                  <label>Thumbnail URL</label>
                  <input 
                    type="url" 
                    value={embed.thumbnail}
                    onChange={(e) => updateEmbed('thumbnail', e.target.value)}
                    placeholder="https://example.com/thumbnail.png"
                  />
                  <p className="help-text">Small image displayed in the top right corner</p>
                </div>

                <div className="form-group">
                  <label>Image URL</label>
                  <input 
                    type="url" 
                    value={embed.image}
                    onChange={(e) => updateEmbed('image', e.target.value)}
                    placeholder="https://example.com/image.png"
                  />
                  <p className="help-text">Large image displayed at the bottom</p>
                </div>
              </div>
            )}

            {activeTab === 'fields' && (
              <div className="tab-panel">
                <div className="fields-header">
                  <p className="help-text">Add up to 25 fields to your embed</p>
                  <button onClick={addField} className="btn-secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Field
                  </button>
                </div>

                {embed.fields.length === 0 ? (
                  <div className="empty-fields">
                    <p>No fields added yet</p>
                  </div>
                ) : (
                  <div className="fields-list">
                    {embed.fields.map((field, index) => (
                      <div key={index} className="field-item">
                        <div className="field-header">
                          <span>Field {index + 1}</span>
                          <button 
                            onClick={() => removeField(index)}
                            className="btn-remove"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                        <div className="form-group">
                          <label>Name</label>
                          <input 
                            type="text" 
                            value={field.name}
                            onChange={(e) => updateField(index, 'name', e.target.value)}
                            placeholder="Field name"
                            maxLength={256}
                          />
                        </div>
                        <div className="form-group">
                          <label>Value</label>
                          <textarea 
                            value={field.value}
                            onChange={(e) => updateField(index, 'value', e.target.value)}
                            placeholder="Field value"
                            rows={3}
                            maxLength={1024}
                          />
                        </div>
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={field.inline}
                              onChange={(e) => updateField(index, 'inline', e.target.checked)}
                            />
                            <span>Display inline</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'send' && (
              <div className="tab-panel">
                <form onSubmit={handleSendEmbed}>
                  <div className="form-group">
                    <label>Select Server</label>
                    <select 
                      value={selectedGuild} 
                      onChange={(e) => setSelectedGuild(e.target.value)}
                      required
                    >
                      <option value="">Choose a server...</option>
                      {guilds.map(guild => (
                        <option key={guild.id} value={guild.id}>
                          {guild.name} ({guild.memberCount} members)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Select Channel</label>
                    <select 
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      disabled={!selectedGuild || loadingChannels}
                      required
                    >
                      <option value="">
                        {!selectedGuild ? 'Select a server first...' : loadingChannels ? 'Loading channels...' : 'Choose a channel...'}
                      </option>
                      {channels.map(channel => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name}
                        </option>
                      ))}
                    </select>
                    <p className="help-text">Select the channel where you want to send the embed</p>
                  </div>

                  <button type="submit" className="btn-primary btn-large" disabled={sending}>
                    {sending ? (
                      <>
                        <div className="spinner-small"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Send Embed
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="embed-preview-panel">
          <div className="preview-header">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Preview
            </h3>
          </div>
          <div className="discord-message-container">
            <div className="discord-message">
              <div className="message-avatar"></div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-author">Your Bot</span>
                  <span className="message-timestamp">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="discord-embed" style={{ borderLeftColor: embed.color }}>
                  {embed.author && (
                    <div className="embed-author">
                      {embed.authorIcon && <img src={embed.authorIcon} alt="" className="author-icon" />}
                      <span>{embed.author}</span>
                    </div>
                  )}
                  {embed.title && (
                    <div className="embed-title">
                      {embed.url ? (
                        <a href={embed.url} target="_blank" rel="noopener noreferrer">
                          {embed.title}
                        </a>
                      ) : embed.title}
                    </div>
                  )}
                  {embed.description && (
                    <div className="embed-description">{embed.description}</div>
                  )}
                  {embed.fields.length > 0 && (
                    <div className="embed-fields">
                      {embed.fields.map((field, index) => (
                        <div key={index} className={`embed-field ${field.inline ? 'inline' : ''}`}>
                          <div className="field-name">{field.name}</div>
                          <div className="field-value">{field.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {embed.thumbnail && (
                    <img src={embed.thumbnail} alt="Thumbnail" className="embed-thumbnail" />
                  )}
                  {embed.image && (
                    <img src={embed.image} alt="Embed" className="embed-image" />
                  )}
                  {embed.footer && (
                    <div className="embed-footer">
                      {embed.footerIcon && <img src={embed.footerIcon} alt="" className="footer-icon" />}
                      <span>{embed.footer}</span>
                      {embed.useTimestamp && (
                        <>
                          <span className="footer-separator">•</span>
                          <span>{new Date().toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmbedMessages
