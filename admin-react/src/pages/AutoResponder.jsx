import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './AutoResponder.css';
import Toast from '../components/Toast';

function AutoResponder() {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [newTrigger, setNewTrigger] = useState({
    type: 'keyword',
    pattern: '',
    response: '',
    caseSensitive: false,
    deleteOriginal: false,
    deleteResponse: false,
    deleteResponseAfter: 5,
    cooldown: 0
  });

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/autoresponder`);
      const data = await response.json();
      
      if (data.success) {
        setTriggers(data.triggers || []);
      } else {
        showToast(data.message || 'Failed to load triggers', 'error');
      }
    } catch (error) {
      console.error('Error fetching triggers:', error);
      showToast('Failed to load triggers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleAddTrigger = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/api/autoresponder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTrigger)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Trigger added successfully!', 'success');
        setShowAddModal(false);
        setNewTrigger({
          type: 'keyword',
          pattern: '',
          response: '',
          caseSensitive: false,
          deleteOriginal: false,
          deleteResponse: false,
          deleteResponseAfter: 5,
          cooldown: 0
        });
        fetchTriggers();
      } else {
        showToast(data.message || 'Failed to add trigger', 'error');
      }
    } catch (error) {
      console.error('Error adding trigger:', error);
      showToast('Failed to add trigger', 'error');
    }
  };

  const handleEditTrigger = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/autoresponder/${editingTrigger.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingTrigger)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Trigger updated successfully!', 'success');
        setShowEditModal(false);
        setEditingTrigger(null);
        fetchTriggers();
      } else {
        showToast(data.message || 'Failed to update trigger', 'error');
      }
    } catch (error) {
      console.error('Error updating trigger:', error);
      showToast('Failed to update trigger', 'error');
    }
  };

  const handleToggleTrigger = async (id) => {
    console.log('Toggle trigger called with id:', id);
    try {
      const response = await fetch(`/api/autoresponder/${id}/toggle`, {
        method: 'PATCH'
      });
      
      console.log('Toggle response status:', response.status);
      const data = await response.json();
      console.log('Toggle response data:', data);
      
      if (data.success) {
        showToast(`Trigger ${data.enabled ? 'enabled' : 'disabled'}!`, 'success');
        setTriggers(triggers.map(t => 
          t.id === id ? { ...t, enabled: data.enabled } : t
        ));
      } else {
        showToast(data.message || 'Failed to toggle trigger', 'error');
      }
    } catch (error) {
      console.error('Error toggling trigger:', error);
      showToast('Failed to toggle trigger', 'error');
    }
  };

  const handleDeleteTrigger = async (id) => {
    console.log('Delete trigger called with id:', id);
    if (!confirm('Are you sure you want to delete this trigger?')) return;
    
    try {
      const response = await fetch(`/api/autoresponder/${id}`, {
        method: 'DELETE'
      });
      
      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response data:', data);
      
      if (data.success) {
        showToast('Trigger deleted successfully!', 'success');
        setTriggers(triggers.filter(t => t.id !== id));
      } else {
        showToast(data.message || 'Failed to delete trigger', 'error');
      }
    } catch (error) {
      console.error('Error deleting trigger:', error);
      showToast('Failed to delete trigger', 'error');
    }
  };

  const openEditModal = (trigger) => {
    setEditingTrigger({ ...trigger });
    setShowEditModal(true);
  };

  const getTriggerIcon = (type) => {
    const icons = {
      keyword: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      ),
      exact: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
      mention: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      regex: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
      startsWith: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      ),
      endsWith: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      )
    };
    return icons[type] || icons.keyword;
  };

  if (loading) {
    return (
      <div className="autoresponder-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading auto-responders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="autoresponder-container">
      {toast.show && (
        <Toast 
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Header */}
      <div className="autoresponder-header">
        <div className="header-content">
          <h1 className="page-title">
            <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M8 10h.01"/>
              <path d="M12 10h.01"/>
              <path d="M16 10h.01"/>
            </svg>
            Auto Responder
          </h1>
          <p className="page-subtitle">
            Automatically reply to keywords, mentions, and patterns
          </p>
        </div>
        <button 
          className="add-trigger-btn"
          onClick={() => setShowAddModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Trigger
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{triggers.length}</div>
            <div className="stat-label">Total Triggers</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{triggers.filter(t => t.enabled).length}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {triggers.reduce((sum, t) => sum + (t.triggerCount || 0), 0)}
            </div>
            <div className="stat-label">Total Activations</div>
          </div>
        </div>
      </div>

      {/* Triggers List */}
      <div className="triggers-section">
        <h2 className="section-title">Active Triggers</h2>
        
        <div className="triggers-grid">
          {/* Add New Card */}
          <div className="trigger-card add-card" onClick={() => setShowAddModal(true)}>
            <div className="add-card-content">
              <div className="add-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <h3>Add New Trigger</h3>
              <p>Create an auto-responder</p>
            </div>
          </div>

          {/* Trigger Cards */}
          {triggers.map(trigger => (
            <div key={trigger.id} className={`trigger-card ${!trigger.enabled ? 'disabled' : ''}`}>
              <div className="trigger-header">
                <div className="trigger-type">
                  <span className="type-icon">{getTriggerIcon(trigger.type)}</span>
                  <span className="type-label">{trigger.type}</span>
                </div>
                <div className={`trigger-status ${trigger.enabled ? 'active' : 'inactive'}`}>
                  {trigger.enabled ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="trigger-content">
                <div className="trigger-pattern">
                  <span className="label">Pattern</span>
                  <code className="pattern-code">{trigger.pattern}</code>
                </div>
                
                <div className="trigger-response">
                  <span className="label">Response</span>
                  <p className="response-text">{trigger.response}</p>
                </div>
              </div>

              <div className="trigger-footer">
                <div className="trigger-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  <span>{trigger.triggerCount || 0} triggers</span>
                </div>
              </div>

              <div className="trigger-actions-bar">
                <button 
                  className="action-btn edit-btn"
                  onClick={() => openEditModal(trigger)}
                  title="Edit"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button 
                  className={`action-btn toggle-btn ${trigger.enabled ? 'active' : ''}`}
                  onClick={() => handleToggleTrigger(trigger.id)}
                  title={trigger.enabled ? 'Disable' : 'Enable'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {trigger.enabled ? (
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    ) : (
                      <circle cx="12" cy="12" r="10"/>
                    )}
                  </svg>
                  {trigger.enabled ? 'Disable' : 'Enable'}
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteTrigger(trigger.id)}
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {triggers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
            </div>
            <h3>No triggers configured</h3>
            <p>Create your first auto-responder to get started</p>
          </div>
        )}
      </div>

      {/* Add Trigger Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Trigger</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddTrigger} className="trigger-form">
              <div className="form-group">
                <label>Trigger Type</label>
                <select 
                  value={newTrigger.type}
                  onChange={(e) => setNewTrigger({...newTrigger, type: e.target.value})}
                  required
                >
                  <option value="keyword">Keyword (contains)</option>
                  <option value="exact">Exact Match</option>
                  <option value="mention">Mention</option>
                  <option value="startsWith">Starts With</option>
                  <option value="endsWith">Ends With</option>
                  <option value="regex">Regex Pattern</option>
                </select>
              </div>

              <div className="form-group">
                <label>Pattern</label>
                <input 
                  type="text"
                  value={newTrigger.pattern}
                  onChange={(e) => setNewTrigger({...newTrigger, pattern: e.target.value})}
                  placeholder="Enter trigger pattern..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Response</label>
                <textarea 
                  value={newTrigger.response}
                  onChange={(e) => setNewTrigger({...newTrigger, response: e.target.value})}
                  placeholder="Enter response message... Use {user}, {username}, {server}, {channel}"
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={newTrigger.caseSensitive}
                      onChange={(e) => setNewTrigger({...newTrigger, caseSensitive: e.target.checked})}
                    />
                    <span>Case Sensitive</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={newTrigger.deleteOriginal}
                      onChange={(e) => setNewTrigger({...newTrigger, deleteOriginal: e.target.checked})}
                    />
                    <span>Delete Original Message</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={newTrigger.deleteResponse}
                      onChange={(e) => setNewTrigger({...newTrigger, deleteResponse: e.target.checked})}
                    />
                    <span>Auto-Delete Bot Response</span>
                  </label>
                </div>

                {newTrigger.deleteResponse && (
                  <div className="form-group">
                    <label>Delete After (seconds)</label>
                    <input 
                      type="number"
                      value={newTrigger.deleteResponseAfter}
                      onChange={(e) => setNewTrigger({...newTrigger, deleteResponseAfter: parseInt(e.target.value) || 0})}
                      min="1"
                      max="300"
                      placeholder="5"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Cooldown (seconds)</label>
                <input 
                  type="number"
                  value={newTrigger.cooldown}
                  onChange={(e) => setNewTrigger({...newTrigger, cooldown: parseInt(e.target.value) || 0})}
                  min="0"
                  max="3600"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Trigger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trigger Modal */}
      {showEditModal && editingTrigger && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Trigger</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditTrigger} className="trigger-form">
              <div className="form-group">
                <label>Trigger Type</label>
                <select 
                  value={editingTrigger.type}
                  onChange={(e) => setEditingTrigger({...editingTrigger, type: e.target.value})}
                  required
                >
                  <option value="keyword">Keyword (contains)</option>
                  <option value="exact">Exact Match</option>
                  <option value="mention">Mention</option>
                  <option value="startsWith">Starts With</option>
                  <option value="endsWith">Ends With</option>
                  <option value="regex">Regex Pattern</option>
                </select>
              </div>

              <div className="form-group">
                <label>Pattern</label>
                <input 
                  type="text"
                  value={editingTrigger.pattern}
                  onChange={(e) => setEditingTrigger({...editingTrigger, pattern: e.target.value})}
                  placeholder="Enter trigger pattern..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Response</label>
                <textarea 
                  value={editingTrigger.response}
                  onChange={(e) => setEditingTrigger({...editingTrigger, response: e.target.value})}
                  placeholder="Enter response message... Use {user}, {username}, {server}, {channel}"
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={editingTrigger.caseSensitive}
                      onChange={(e) => setEditingTrigger({...editingTrigger, caseSensitive: e.target.checked})}
                    />
                    <span>Case Sensitive</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={editingTrigger.deleteOriginal}
                      onChange={(e) => setEditingTrigger({...editingTrigger, deleteOriginal: e.target.checked})}
                    />
                    <span>Delete Original Message</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={editingTrigger.deleteResponse || false}
                      onChange={(e) => setEditingTrigger({...editingTrigger, deleteResponse: e.target.checked})}
                    />
                    <span>Auto-Delete Bot Response</span>
                  </label>
                </div>

                {editingTrigger.deleteResponse && (
                  <div className="form-group">
                    <label>Delete After (seconds)</label>
                    <input 
                      type="number"
                      value={editingTrigger.deleteResponseAfter || 5}
                      onChange={(e) => setEditingTrigger({...editingTrigger, deleteResponseAfter: parseInt(e.target.value) || 0})}
                      min="1"
                      max="300"
                      placeholder="5"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Cooldown (seconds)</label>
                <input 
                  type="number"
                  value={editingTrigger.cooldown || 0}
                  onChange={(e) => setEditingTrigger({...editingTrigger, cooldown: parseInt(e.target.value) || 0})}
                  min="0"
                  max="3600"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutoResponder;
