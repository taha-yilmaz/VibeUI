import React from 'react';

interface LandingPageProps {
  onStartFree: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onStartFree, onLogin }: LandingPageProps) {
  return (
    <div className="landing-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="landing-header">
        <div className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
          <img src="/logo-vibeUI.png" alt="VibeUI Logo" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em' }}>VibeUI</span>
        </div>
        <nav className="flex items-center gap-4">
          <button onClick={onLogin} className="btn-linear btn-linear-secondary">
            Log in
          </button>
          <button onClick={onStartFree} className="btn-linear btn-linear-primary">
            Sign up
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ flexGrow: 1 }}>
        <section className="landing-hero">
          <div className="badge-dot completed" style={{ marginBottom: 24, fontSize: 12 }}>
            Now in public beta
          </div>
          <h1 className="hero-slogan">
            Your ultimate UI reference engine
          </h1>
          <p className="hero-tagline">
            Deep-crawl web pages, extract clean DOM structures, and generate exact desktop and mobile visual screenshots optimized for AI reconstruction.
          </p>
          <div className="hero-actions">
            <button onClick={onStartFree} className="btn-linear btn-linear-primary" style={{ padding: '10px 24px', fontSize: 15 }}>
              Try for free
            </button>
            <button onClick={onLogin} className="btn-linear btn-linear-secondary" style={{ padding: '10px 24px', fontSize: 15 }}>
              Open app
            </button>
          </div>

          {/* App Preview Mockup */}
          <div className="card-panel" style={{ maxWidth: 900, width: '100%', padding: 6, background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 80px rgba(94, 106, 210, 0.15)' }}>
            <div style={{ background: '#12111a', borderRadius: '8px', padding: '16px', textAlign: 'left', minHeight: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Fake Window Header */}
              <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }}></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8, fontFamily: 'monospace' }}>vibeui.app/dashboard</div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
              </div>
              {/* Fake Dashboard */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Active crawlers</span>
                  <span className="stat-value">3</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Pages Scraping</span>
                  <span className="stat-value" style={{ color: 'var(--accent)' }}>847</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">System Status</span>
                  <span className="stat-value" style={{ color: 'var(--success)' }}>99.8%</span>
                </div>
              </div>
              <div className="linear-list">
                <div className="linear-list-item">
                  <div className="flex items-center gap-2">
                    <span className="badge-dot processing">Processing</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>https://stripe.com</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Depth: 2 · 42 pages discovered</span>
                </div>
                <div className="linear-list-item">
                  <div className="flex items-center gap-2">
                    <span className="badge-dot completed">Completed</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>https://vercel.com</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Depth: 1 · 12 pages processed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🕸️</div>
            <h3 className="feature-title">Deep Crawling</h3>
            <p className="feature-desc">Configure crawler limits, search depth levels up to 3, and collect clean HTML markup structures dynamically.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3 className="feature-title">Visual References</h3>
            <p className="feature-desc">Automatically captures desktop (1440x900) and mobile (390x844) viewport screenshots for pristine pixel accuracy.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">AI Ready Export</h3>
            <p className="feature-desc">Export high-quality screenshot previews alongside normalized HTML DOM trees direct to prompt formats.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3 className="feature-title">Authenticated Scraping</h3>
            <p className="feature-desc">Instantly open remote Chromium instances to capture authenticated session cookies and headers.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 48px', color: 'var(--text-muted)', fontSize: 12, display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
        <span>&copy; {new Date().getFullYear()} VibeUI. All rights reserved.</span>
        <div className="flex gap-4">
          <span style={{ cursor: 'pointer' }}>Docs</span>
          <span style={{ cursor: 'pointer' }}>Changelog</span>
          <span style={{ cursor: 'pointer' }}>GitHub</span>
        </div>
      </footer>
    </div>
  );
}
