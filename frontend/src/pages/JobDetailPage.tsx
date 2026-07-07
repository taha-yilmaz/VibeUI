import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { JobStatus, ScrapedPage } from '../api';

interface JobDetailPageProps {
  jobId: string;
  onBack: () => void;
  onViewPage: (pageId: string) => void;
}

export default function JobDetailPage({ jobId, onBack, onViewPage }: JobDetailPageProps) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [pages, setPages] = useState<ScrapedPage[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    
    const fetchStatus = async () => {
      try {
        const jobData = await api.getJobStatus(jobId);
        if (mounted) setStatus(jobData);
        
        const pagesData = await api.getJobPages(jobId);
        if (mounted) setPages(pagesData.pages);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to fetch job status');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [jobId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to stop and delete this job?')) return;
    try {
      await api.deleteJob(jobId);
      onBack();
    } catch (e: any) {
      alert('Failed to delete job: ' + e.message);
    }
  };

  const getStatusBadge = (s: string) => {
    const l = s.toLowerCase();
    return <span className={`badge-dot ${l}`}>{s}</span>;
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button className="btn-linear btn-linear-secondary" onClick={onBack}>
            &larr; Back
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Job Details</h2>
        </div>
        <button className="btn-linear btn-linear-danger" onClick={handleDelete}>
          Delete Job
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 13, border: '1px solid rgba(226, 88, 80, 0.2)' }}>
          {error}
        </div>
      )}

      <div className="split-view">
        {/* Pages discovered list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div className="card-panel">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Extracted Pages</h3>
            <div className="linear-list">
              {pages.map(p => (
                <div key={p.id} className="linear-list-item" onClick={() => onViewPage(p.id)}>
                  <div className="flex flex-col gap-1" style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                    <span style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', display: 'block', width: '100%' }}>
                      {p.title || p.url}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>
                      {p.url}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(p.status)}
                    <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 500 }}>View &rarr;</span>
                  </div>
                </div>
              ))}
              {pages.length === 0 && (
                <div className="linear-list-item" style={{ justifyContent: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  No pages discovered yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="meta-panel">
          <div className="meta-group">
            <span className="meta-label">Crawl Status</span>
            <span className="meta-value">{status ? getStatusBadge(status.status) : 'Fetching...'}</span>
          </div>
          <div className="meta-group">
            <span className="meta-label">Pages Found</span>
            <span className="meta-value" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {status ? status.pagesDiscovered : 0}
            </span>
          </div>
          <div className="meta-group">
            <span className="meta-label">Pages Processed</span>
            <span className="meta-value" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {status ? status.pagesProcessed : 0}
            </span>
          </div>
          <div className="meta-group">
            <span className="meta-label">Created At</span>
            <span className="meta-value">
              {status ? new Date(status.createdAt).toLocaleString() : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
