import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface RecentJob {
  id: string;
  name?: string;
  targetUrl: string;
  createdAt: string;
  status: string;
}

interface JobsPageProps {
  onViewJob: (id: string) => void;
  onStartCrawlClick: () => void;
}

export default function JobsPage({ onViewJob, onStartCrawlClick }: JobsPageProps) {
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await api.getJobs();
        setRecentJobs(data.jobs);
      } catch (e) {
        console.error('Failed to fetch jobs', e);
      }
    };
    fetchJobs();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to stop and delete this job?')) return;
    try {
      await api.deleteJob(id);
      const updatedJobs = recentJobs.filter(j => j.id !== id);
      setRecentJobs(updatedJobs);
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSaveName = async (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.updateJob(id, editingName);
      setRecentJobs(jobs => jobs.map(j => j.id === id ? { ...j, name: editingName } : j));
      setEditingJobId(null);
    } catch (err: any) {
      alert('Failed to update name: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Crawl Jobs
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Review, check status, and retrieve scraped UI assets.
          </p>
        </div>
        <button onClick={onStartCrawlClick} className="btn-linear btn-linear-primary">
          <span style={{ fontSize: 16 }}>+</span> New Crawl
        </button>
      </div>

      <div className="card-panel">
        {recentJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: 16 }}>No crawl jobs created yet.</p>
            <button onClick={onStartCrawlClick} className="btn-linear btn-linear-primary">
              Start your first crawl
            </button>
          </div>
        ) : (
          <div className="linear-list">
            {recentJobs.map(job => (
              <div key={job.id} className="linear-list-item" onClick={() => onViewJob(job.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                  <div className="workspace-logo" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    {job.targetUrl.replace(/^https?:\/\/(www\.)?/, '')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1" style={{ minWidth: 0, flex: 1 }}>
                    {editingJobId === job.id ? (
                      <form onSubmit={(e) => handleSaveName(e, job.id)} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input-linear"
                          style={{ padding: '2px 8px', fontSize: 13, height: 24 }}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        <button type="submit" className="btn-linear btn-linear-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={(e) => e.stopPropagation()}>
                          Save
                        </button>
                        <button type="button" className="btn-linear" style={{ padding: '2px 8px', fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setEditingJobId(null); }}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                          {job.name ? job.name : job.targetUrl}
                        </span>
                        <button className="btn-linear" style={{ flexShrink: 0, padding: '2px 6px', fontSize: 10, opacity: 0.5 }} onClick={(e) => {
                          e.stopPropagation();
                          setEditingJobId(job.id);
                          setEditingName(job.name || '');
                        }}>Edit</button>
                      </div>
                    )}
                    {job.name && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>{job.targetUrl}</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(job.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge-dot completed" style={{ fontSize: 11 }}>Idle</span>
                  <button className="btn-linear btn-linear-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={(e) => handleDelete(e, job.id)}>
                    Delete
                  </button>
                  <button className="btn-linear btn-linear-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
