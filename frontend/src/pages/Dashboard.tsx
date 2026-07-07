import React, { useState, useEffect } from 'react';
import { api } from '../api';
import QuotaWarning from '../components/QuotaWarning';

interface RecentJob {
  id: string;
  name?: string;
  targetUrl: string;
  createdAt: string;
  status: string;
}

interface DashboardProps {
  onViewJob: (id: string) => void;
  onNavigateToSessions: () => void;
  onStartCrawlClick: () => void;
  isAnonymous: boolean;
  remainingCredits: number;
  onSignUpClick: () => void;
}

export default function Dashboard({
  onViewJob,
  onNavigateToSessions,
  onStartCrawlClick,
  isAnonymous,
  remainingCredits,
  onSignUpClick
}: DashboardProps) {
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalPages: 0,
    successRate: '100%',
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await api.getJobs();
        setRecentJobs(data.jobs);
        
        const total = data.jobs.length;
        const active = data.jobs.filter(j => j.status === 'PROCESSING' || j.status === 'PENDING').length;
        setStats({
          totalJobs: total,
          activeJobs: active,
          totalPages: total * 12, // mock metric for now
          successRate: total > 0 ? '94%' : '0%',
        });
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
      setStats(prev => ({
        ...prev,
        totalJobs: updatedJobs.length,
        totalPages: updatedJobs.length * 12,
      }));
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
      {/* Top Warning Banner for anonymous users */}
      <QuotaWarning 
        remainingCredits={remainingCredits}
        isAnonymous={isAnonymous}
        onSignUpClick={onSignUpClick}
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Good morning
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Here is what's happening with your UI crawls.
          </p>
        </div>
        <button onClick={onStartCrawlClick} className="btn-linear btn-linear-primary">
          <span style={{ fontSize: 16 }}>+</span> New Crawl
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Jobs</span>
          <span className="stat-value">{stats.totalJobs}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Crawls</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>{stats.activeJobs}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pages Extracted</span>
          <span className="stat-value">{stats.totalPages}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Crawl Success</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.successRate}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 24 }}>
        {/* Recent Jobs */}
        <div className="card-panel">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Jobs</h3>
          {recentJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 12 }}>No crawl jobs started yet.</p>
              <button onClick={onStartCrawlClick} className="btn-linear btn-linear-primary">
                Start first crawl
              </button>
            </div>
          ) : (
            <div className="linear-list">
              {recentJobs.map(job => (
                <div key={job.id} className="linear-list-item" onClick={() => onViewJob(job.id)}>
                  <div className="flex flex-col gap-1" style={{ flex: 1, minWidth: 0 }}>
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
                        <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
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
                  <div className="flex items-center gap-2">
                    <button className="btn-linear btn-linear-danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={(e) => handleDelete(e, job.id)}>
                      Delete
                    </button>
                    <button className="btn-linear btn-linear-secondary" style={{ padding: '4px 8px', fontSize: 11 }}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-panel">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🏢</span> Workspace Info
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              A Workspace organizes your crawl jobs, auth sessions, and quotas in one place. Invite team members to collaborate and share the same environment.
            </p>
          </div>

          <div className="card-panel" style={{ flexGrow: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Quick Setup</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Set up cookies to crawl pages behind login gates.
            </p>
            <button onClick={onNavigateToSessions} className="btn-linear btn-linear-secondary" style={{ width: '100%' }}>
              Manage Sessions
            </button>
          </div>

          <div className="card-panel" style={{ background: 'linear-gradient(135deg, rgba(94, 106, 210, 0.05) 0%, transparent 100%)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>VibeUI Quota</h3>
            {isAnonymous ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Using free anonymous plan.
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ background: 'var(--accent)', width: `${((2 - remainingCredits) / 2) * 100}%`, height: '100%' }}></div>
                </div>
                <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{2 - remainingCredits} of 2 crawls used</span>
                  <span>{Math.min(100, Math.round(((2 - remainingCredits) / 2) * 100))}%</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Unlimited crawls available.
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ background: 'var(--success)', width: '100%', height: '100%' }}></div>
                </div>
                <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Unlimited crawls</span>
                  <span style={{ color: 'var(--success)' }}>Active</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
