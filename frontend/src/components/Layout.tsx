import React from 'react';

interface LayoutProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'jobs' | 'sessions') => void;
  onOpenNewCrawl: () => void;
  onTriggerSearch: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  workspaceName: string;
  isAnonymous: boolean;
  children: React.ReactNode;
}

export default function Layout({
  currentView,
  onNavigate,
  onOpenNewCrawl,
  onTriggerSearch,
  onLogout,
  onOpenSettings,
  workspaceName,
  isAnonymous,
  children
}: LayoutProps) {
  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'jobs':
        return 'Crawl Jobs';
      case 'job':
        return 'Job Details';
      case 'page':
        return 'Page Details';
      case 'sessions':
        return 'Auth Sessions';
      default:
        return 'Workspace';
    }
  };

  return (
    <div className="app-container">
      {/* Sol Sidebar */}
      <aside className="sidebar">
        {/* App Brand Header */}
        <div style={{ padding: '8px 8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo-vibeUI.png" alt="VibeUI Logo" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>VibeUI</span>
        </div>

        {/* Workspace Dropdown */}
        <div className="workspace-selector">
          <div className="workspace-logo">
            {workspaceName ? workspaceName[0].toUpperCase() : 'A'}
          </div>
          <div className="flex flex-col" style={{ minWidth: 0, flexGrow: 1 }}>
            <span className="workspace-name">{workspaceName || 'Anonymous'}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {isAnonymous ? 'Free Plan' : 'Pro Workspace'}
            </span>
          </div>
          <div className="custom-tooltip" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div className="tooltip-text">
              A Workspace organizes your crawl jobs, auth sessions, and quotas in one place.
            </div>
          </div>
        </div>

        {/* Global Action Button */}
        <button onClick={onOpenNewCrawl} className="btn-linear btn-linear-primary" style={{ width: '100%', marginBottom: 16 }}>
          <span>+</span> New Crawl
        </button>

        {/* Navigation list */}
        <div className="nav-section">
          <div className="nav-header">Workspace</div>
          
          <div onClick={() => onNavigate('dashboard')} className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}>
            <div className="nav-item-left">
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </div>
            <span className="nav-shortcut">G D</span>
          </div>

          <div onClick={() => onNavigate('jobs')} className={`nav-item ${currentView === 'jobs' || currentView === 'job' || currentView === 'page' ? 'active' : ''}`}>
            <div className="nav-item-left">
              <span className="nav-icon">🕸️</span>
              <span>Crawl Jobs</span>
            </div>
            <span className="nav-shortcut">G J</span>
          </div>

          <div onClick={() => onNavigate('sessions')} className={`nav-item ${currentView === 'sessions' ? 'active' : ''}`}>
            <div className="nav-item-left">
              <span className="nav-icon">🔐</span>
              <span>Auth Sessions</span>
            </div>
            <span className="nav-shortcut">G S</span>
          </div>
        </div>

        <div style={{ flexGrow: 1 }} />

        {/* Bottom Profile / Settings */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
            <div className="workspace-logo" style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>U</div>
            <div className="flex flex-col" style={{ minWidth: 0, flexGrow: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isAnonymous ? 'Guest User' : 'Workspace Member'}
              </span>
            </div>
          </div>
          {!isAnonymous && (
            <button onClick={onOpenSettings} className="btn-linear btn-linear-secondary" style={{ width: '100%', padding: '4px 8px', fontSize: 11 }}>
              Settings
            </button>
          )}
          <button onClick={onLogout} className="btn-linear btn-linear-secondary" style={{ width: '100%', padding: '4px 8px', fontSize: 11 }}>
            {isAnonymous ? 'Exit Demo' : 'Log out'}
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="main-wrapper">
        <header className="top-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">{getBreadcrumbTitle()}</span>
          </div>

          <div className="header-actions">
            <div className="search-trigger" onClick={onTriggerSearch}>
              <span>Search jobs...</span>
              <span className="nav-shortcut" style={{ fontSize: 9 }}>⌘K</span>
            </div>
          </div>
        </header>

        <main style={{ flexGrow: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
