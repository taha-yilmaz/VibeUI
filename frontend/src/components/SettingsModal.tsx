import React, { useState } from 'react';
import { api } from '../api';

interface SettingsModalProps {
  currentWorkspaceName: string;
  onClose: () => void;
  onWorkspaceUpdated: (newName: string) => void;
}

export default function SettingsModal({ currentWorkspaceName, onClose, onWorkspaceUpdated }: SettingsModalProps) {
  const [workspaceName, setWorkspaceName] = useState(currentWorkspaceName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setError('Workspace name cannot be empty');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.updateWorkspace(workspaceName);
      onWorkspaceUpdated(workspaceName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update workspace name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Workspace Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ color: 'var(--danger)', padding: 10, background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Workspace Name</label>
              <input 
                type="text" 
                className="input-linear" 
                value={workspaceName} 
                onChange={e => setWorkspaceName(e.target.value)} 
                required 
                autoFocus 
              />
            </div>
            
          </div>
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={onClose} className="btn-linear btn-linear-secondary">Cancel</button>
            <button type="submit" className="btn-linear btn-linear-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
