import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface NewCrawlModalProps {
  onClose: () => void;
  onJobStarted: (jobId: string) => void;
}

export default function NewCrawlModal({ onClose, onJobStarted }: NewCrawlModalProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [maxDepth, setMaxDepth] = useState(1);
  const [authSessionId, setAuthSessionId] = useState('');
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await api.getSessions();
        setSessions(res.sessions);
      } catch (e) {}
    };
    loadSessions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.createJob(url, name, maxDepth, authSessionId);
      if (res.success) {
        onJobStarted(res.jobId);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start crawl job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontWeight: 600, fontSize: 15 }}>Start Crawl Process</span>
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
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Job Name <span style={{ textTransform: 'none', fontWeight: 400 }}>(Optional)</span></label>
              <input type="text" className="input-linear" placeholder="example site pages" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target URL</label>
              <input type="url" className="input-linear" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max Crawl Depth ({maxDepth})</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[1, 2, 3].map(depth => (
                  <button key={depth} type="button" onClick={() => setMaxDepth(depth)} className="btn-linear" style={{ flex: 1, background: maxDepth === depth ? 'var(--accent)' : 'rgba(255,255,255,0.02)', borderColor: maxDepth === depth ? 'var(--accent)' : 'var(--border)', color: '#fff' }}>
                    Depth {depth}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                {maxDepth === 1 && "Only crawls the exact URL provided (1 page). Ideal for targeting a specific component."}
                {maxDepth === 2 && "Crawls the target URL and all links found on it. Best for capturing complete UI references."}
                {maxDepth === 3 && "Follows links deeply. May discover hundreds of pages and quickly consume crawl limits."}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Authentication Session</label>
              <select className="input-linear" value={authSessionId} onChange={e => setAuthSessionId(e.target.value)} style={{ width: '100%', background: 'var(--bg-surface)' }}>
                <option value="">No Session (Anonymous Crawler)</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-linear btn-linear-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-linear btn-linear-primary" disabled={loading}>
              {loading ? 'Queueing...' : 'Crawl Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
