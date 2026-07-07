import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<{ id: string; name: string; createdAt: string }[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureUrl, setCaptureUrl] = useState('');
  const [captureId, setCaptureId] = useState('');
  const [captureName, setCaptureName] = useState('');
  const [captureStatus, setCaptureStatus] = useState('');
  const [error, setError] = useState('');

  const loadSessions = async () => {
    try {
      const res = await api.getSessions();
      setSessions(res.sessions);
    } catch (e) {}
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const startCapture = async () => {
    if (!captureUrl) return;
    setError('');
    setCaptureStatus('Launching secure session on server...');
    try {
      const res = await api.captureSession(captureUrl);
      setCaptureId(res.captureId);
      setCaptureStatus('Browser launched! Log in on the server browser, then name and save.');
    } catch (err: any) {
      setError(err.message);
      setCaptureStatus('');
    }
  };

  const saveCapture = async () => {
    if (!captureName || !captureId) return;
    setError('');
    setCaptureStatus('Saving cookies and session state...');
    try {
      const res = await api.saveSession(captureId, captureName);
      setCaptureStatus('');
      setCaptureId('');
      setCaptureName('');
      setCaptureUrl('');
      setIsCapturing(false);
      await loadSessions();
    } catch (err: any) {
      setError(err.message);
      setCaptureStatus('Session capture failed. Check browser logs.');
    }
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Auth Sessions
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Establish authenticated states to capture dashboard structures behind login gateways.
          </p>
        </div>
        <button onClick={() => setIsCapturing(!isCapturing)} className="btn-linear btn-linear-primary">
          {isCapturing ? 'Cancel Capture' : '+ Capture Session'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isCapturing ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Active sessions list */}
        <div className="card-panel">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Saved Sessions</h3>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No authentication sessions stored yet.
            </div>
          ) : (
            <div className="linear-list">
              {sessions.map(s => (
                <div key={s.id} className="linear-list-item" style={{ cursor: 'default' }}>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {s.id}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Capture New Session Panel */}
        {isCapturing && (
          <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Configure New Session</h3>
            {!captureId ? (
              <>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Provide the address of the target page's login form.
                </p>
                <input type="url" className="input-linear" placeholder="e.g. https://github.com/login" value={captureUrl} onChange={e => setCaptureUrl(e.target.value)} />
                <button onClick={startCapture} className="btn-linear btn-linear-primary" style={{ alignSelf: 'flex-start' }} disabled={!captureUrl}>
                  Launch Capture Session
                </button>
              </>
            ) : (
              <>
                <div style={{ padding: 12, background: 'rgba(94,106,210,0.08)', border: '1px solid var(--accent)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  {captureStatus}
                </div>
                <input type="text" className="input-linear" placeholder="e.g. GitHub Workspace Session" value={captureName} onChange={e => setCaptureName(e.target.value)} />
                <button onClick={saveCapture} className="btn-linear btn-linear-primary" style={{ alignSelf: 'flex-start' }} disabled={!captureName}>
                  Save & Secure Session
                </button>
              </>
            )}
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 12, background: 'var(--danger-bg)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
