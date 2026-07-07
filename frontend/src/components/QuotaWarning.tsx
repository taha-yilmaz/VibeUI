import React from 'react';

interface QuotaWarningProps {
  remainingCredits: number;
  isAnonymous: boolean;
  onSignUpClick: () => void;
}

export default function QuotaWarning({ remainingCredits, isAnonymous, onSignUpClick }: QuotaWarningProps) {
  if (!isAnonymous) return null;
  if (remainingCredits > 1) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(94,106,210,0.12) 0%, rgba(94,106,210,0.02) 100%)',
      border: '1px solid rgba(94, 106, 210, 0.2)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <div className="flex flex-col">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isAnonymous 
              ? `${remainingCredits} guest crawl credit${remainingCredits === 1 ? '' : 's'} remaining`
              : 'Free Plan Active'
            }
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {isAnonymous 
              ? 'Create a free account to keep your crawl references permanently and lift anonymous restrictions.'
              : 'Upgrade to VibeUI Pro for unlimited crawlers, auth sessions, and deep workspace search.'
            }
          </span>
        </div>
      </div>
      <button onClick={onSignUpClick} className="btn-linear btn-linear-primary" style={{ padding: '4px 12px', fontSize: 11, whiteSpace: 'nowrap' }}>
        {isAnonymous ? 'Save my crawls (Sign Up)' : 'Go Pro'}
      </button>
    </div>
  );
}
