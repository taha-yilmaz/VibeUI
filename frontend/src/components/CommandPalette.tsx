import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface CommandPaletteProps {
  onClose: () => void;
  onNavigate: (view: 'dashboard' | 'jobs' | 'sessions') => void;
  onOpenNewCrawl: () => void;
  onViewJob: (jobId: string) => void;
}

export default function CommandPalette({ onClose, onNavigate, onOpenNewCrawl, onViewJob }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    api.getJobs().then(data => {
      if (mounted) setJobs(data.jobs);
    }).catch(err => console.error("Failed to fetch jobs for palette", err));
    return () => { mounted = false; };
  }, []);

  const actionItems = [
    { id: 'dash', title: 'Go to Dashboard', type: 'Action', shortcut: 'G D', action: () => onNavigate('dashboard') },
    { id: 'jobs', title: 'View Crawl Jobs', type: 'Action', shortcut: 'G J', action: () => onNavigate('jobs') },
    { id: 'sess', title: 'Manage Auth Sessions', type: 'Action', shortcut: 'G S', action: () => onNavigate('sessions') },
    { id: 'new', title: 'Start New Crawl...', type: 'Action', shortcut: 'C', action: () => onOpenNewCrawl() },
  ];

  const jobItems = jobs.map(job => ({
    id: `job-${job.id}`,
    title: job.name ? job.name : job.targetUrl,
    type: 'Job',
    shortcut: '↵',
    action: () => onViewJob(job.id)
  }));

  const allItems = [...actionItems, ...jobItems];

  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onClose]);

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-box" onClick={e => e.stopPropagation()}>
        <div className="palette-input-wrapper">
          <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
          <input type="text" className="palette-input" placeholder="Search jobs, or type a command..." value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }} autoFocus />
        </div>
        <div className="palette-results">
          {filteredItems.map((item, idx) => (
            <div key={item.id} onClick={() => { item.action(); onClose(); }} className={`palette-item ${idx === selectedIndex ? 'selected' : ''}`}>
              <div className="flex items-center gap-2" style={{ minWidth: 0, overflow: 'hidden' }}>
                {item.type === 'Job' && <span style={{ fontSize: 14 }}>🕸️</span>}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
              </div>
              <span className="nav-shortcut">{item.shortcut}</span>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              No results found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
