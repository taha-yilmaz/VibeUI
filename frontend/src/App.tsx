import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import PageDetailPage from './pages/PageDetailPage';
import SessionsPage from './pages/SessionsPage';
import NewCrawlModal from './components/NewCrawlModal';
import SettingsModal from './components/SettingsModal';
import CommandPalette from './components/CommandPalette';
import { useAuth } from './context/AuthContext';
import { api } from './api';
import './index.css';

type View = 'landing' | 'login' | 'register' | 'dashboard' | 'jobs' | 'job' | 'page' | 'sessions';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const {
    isAuthenticated,
    isAnonymous,
    workspaceName,
    login,
    register,
    loginAsGuest,
    logout
  } = useAuth();
  
  // Usage tracking for anonymous users
  const [remainingCredits, setRemainingCredits] = useState<number>(() => {
    const saved = localStorage.getItem('remainingCredits');
    return saved !== null ? parseInt(saved) : 2;
  });

  useEffect(() => {
    localStorage.setItem('remainingCredits', remainingCredits.toString());
  }, [remainingCredits]);

  // Adjust current view if user is already authenticated on reload
  useEffect(() => {
    if (isAuthenticated && view === 'landing') {
      setView('dashboard');
    }
  }, [isAuthenticated]);
  
  // Modal / overlay states
  const [isNewCrawlOpen, setIsNewCrawlOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Navigation states
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  // Key shortcuts
  useEffect(() => {
    let keyBuffer = '';
    let bufferTimeout: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
        return;
      }

      if (isPaletteOpen || isNewCrawlOpen || !isAuthenticated) return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handleOpenNewCrawl();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      keyBuffer += e.key.toLowerCase();
      clearTimeout(bufferTimeout);
      
      if (keyBuffer === 'gd') {
        setView('dashboard');
        keyBuffer = '';
      } else if (keyBuffer === 'gj') {
        setView('jobs');
        keyBuffer = '';
      } else if (keyBuffer === 'gs') {
        setView('sessions');
        keyBuffer = '';
      }

      bufferTimeout = setTimeout(() => {
        keyBuffer = '';
      }, 500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen, isNewCrawlOpen, isAuthenticated, isAnonymous, remainingCredits]);

  const handleLogout = () => {
    logout();
    setView('landing');
  };

  const handleOpenNewCrawl = () => {
    if (isAnonymous && remainingCredits <= 0) {
      alert("You've used your free credits. Sign up to get unlimited crawls!");
      setView('register');
      return;
    }
    setIsNewCrawlOpen(true);
  };

  const handleJobStarted = (jobId: string) => {
    if (isAnonymous) {
      setRemainingCredits(prev => Math.max(0, prev - 1));
    }
    setCurrentJobId(jobId);
    setView('job');
  };

  const handleViewJob = (jobId: string) => {
    setCurrentJobId(jobId);
    setView('job');
  };

  const handleViewPage = (pageId: string) => {
    setCurrentPageId(pageId);
    setView('page');
  };

  if (!isAuthenticated) {
    if (view === 'login') {
      return (
        <LoginPage
          onLoginSuccess={(token, name) => {
            login(token, name);
            setView('dashboard');
          }}
          onNavigateToRegister={() => setView('register')}
          onContinueAnonymously={async () => {
            try {
              const res = await api.authGuest();
              loginAsGuest(res.token);
              setView('dashboard');
            } catch (err) {
              alert('Guest login failed. Please ensure the backend is running.');
            }
          }}
          onBackToLanding={() => setView('landing')}
        />
      );
    }
    if (view === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={(token, name) => {
            register(token, name);
            setView('dashboard');
          }}
          onNavigateToLogin={() => setView('login')}
          onBackToLanding={() => setView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onStartFree={() => setView('register')}
        onLogin={() => setView('login')}
      />
    );
  }

  return (
    <Layout
      currentView={view}
      onNavigate={(v) => setView(v)}
      onOpenNewCrawl={handleOpenNewCrawl}
      onTriggerSearch={() => setIsPaletteOpen(true)}
      onLogout={handleLogout}
      onOpenSettings={() => setIsSettingsOpen(true)}
      workspaceName={workspaceName}
      isAnonymous={isAnonymous}
    >
      {view === 'dashboard' && (
        <Dashboard
          onViewJob={handleViewJob}
          onNavigateToSessions={() => setView('sessions')}
          onStartCrawlClick={handleOpenNewCrawl}
          isAnonymous={isAnonymous}
          remainingCredits={remainingCredits}
          onSignUpClick={() => setView('register')}
        />
      )}
      {view === 'jobs' && (
        <JobsPage
          onViewJob={handleViewJob}
          onStartCrawlClick={handleOpenNewCrawl}
        />
      )}
      {view === 'job' && currentJobId && (
        <JobDetailPage
          jobId={currentJobId}
          onBack={() => setView('jobs')}
          onViewPage={handleViewPage}
        />
      )}
      {view === 'page' && currentPageId && (
        <PageDetailPage
          pageId={currentPageId}
          onBack={() => setView('job')}
        />
      )}
      {view === 'sessions' && <SessionsPage />}

      {/* Overlays / Modals */}
      {isNewCrawlOpen && (
        <NewCrawlModal
          onClose={() => setIsNewCrawlOpen(false)}
          onJobStarted={handleJobStarted}
        />
      )}

      {isPaletteOpen && (
        <CommandPalette
          onClose={() => setIsPaletteOpen(false)}
          onNavigate={(v) => setView(v)}
          onOpenNewCrawl={handleOpenNewCrawl}
          onViewJob={handleViewJob}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          currentWorkspaceName={workspaceName}
          onClose={() => setIsSettingsOpen(false)}
          onWorkspaceUpdated={(newName) => {
            // Force a reload to refresh auth context or handle via context.
            // For now, since authContext stores workspaceName in token, we just reload the page to refresh token, or let them know it's updated.
            // Actually, we can just reload the window to fetch the new context/token.
            window.location.reload();
          }}
        />
      )}
    </Layout>
  );
}
