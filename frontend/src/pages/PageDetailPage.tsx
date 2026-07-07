import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { PageDetails } from '../api';

interface PageDetailPageProps {
  pageId: string;
  onBack: () => void;
}

export default function PageDetailPage({ pageId, onBack }: PageDetailPageProps) {
  const [page, setPage] = useState<PageDetails | null>(null);
  const [error, setError] = useState('');
  const [markdown, setMarkdown] = useState<string>('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await api.getPageDetails(pageId);
        setPage(data);
        
        // Fetch markdown separately
        const mdRes = await fetch(api.getPageMarkdownUrl(pageId));
        if (mdRes.ok) {
          setMarkdown(await mdRes.text());
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch page details');
      }
    };
    fetchPage();
  }, [pageId]);

  const copyMarkdown = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (s: string) => {
    const l = s.toLowerCase();
    return <span className={`badge-dot ${l}`}>{s}</span>;
  };

  if (error) {
    return (
      <div className="page-container">
        <button className="btn-linear btn-linear-secondary mb-4" onClick={onBack}>
          &larr; Back
        </button>
        <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(226, 88, 80, 0.2)' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading references...</div>
      </div>
    );
  }

  const screenshotUrl = device === 'desktop' ? page.screenshotDesktopUrl : page.screenshotMobileUrl;

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4" style={{ minWidth: 0 }}>
          <button className="btn-linear btn-linear-secondary" onClick={onBack}>
            &larr; Back
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {page.title || 'Page Details'}
          </h2>
        </div>
        {getStatusBadge(page.status)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Screenshot View */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="flex justify-between items-center">
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Visual Reference</h3>
            <div className="flex gap-1" style={{ background: 'rgba(255,255,255,0.03)', padding: 2, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <button onClick={() => setDevice('desktop')} className="btn-linear" style={{ background: device === 'desktop' ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', padding: '4px 10px', fontSize: 11 }}>
                Desktop
              </button>
              <button onClick={() => setDevice('mobile')} className="btn-linear" style={{ background: device === 'mobile' ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', padding: '4px 10px', fontSize: 11 }}>
                Mobile
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#0a0a0f', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, position: 'relative' }}>
            {screenshotUrl ? (
              <img src={screenshotUrl} alt={`${device} view`} style={{ maxWidth: '100%', maxHeight: '500px', display: 'block', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {page.status === 'COMPLETED' ? 'No screenshot captured.' : 'Generating snapshot reference...'}
              </div>
            )}
          </div>
          
          <div style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
            <strong>Target URL:</strong> <a href={page.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-link)', textDecoration: 'underline' }}>{page.url}</a>
          </div>
        </div>

        {/* AI Ready Markdown */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="flex justify-between items-center">
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>AI Reference Markdown</h3>
            <button onClick={copyMarkdown} className="btn-linear btn-linear-primary" style={{ padding: '4px 12px', fontSize: 12 }} disabled={!markdown}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div style={{ background: '#040406', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid #1c1a24', flexGrow: 1, maxHeight: '500px', overflowY: 'auto' }}>
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#b2c8f8', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {markdown || 'Loading reference model...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
