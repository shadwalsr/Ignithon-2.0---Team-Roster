import React from 'react';
import { Shield, Sparkles, PlusCircle, LogOut, Lock, Eye, EyeOff } from 'lucide-react';

export default function Navbar({
  currentCase,
  cases,
  onSelectCase,
  onNewCase,
  onSeedCase,
  user,
  onLogout,
  onOpenAuth,
  activeTab,
  setActiveTab,
  isInvestigatorMode,
  onToggleInvestigatorMode,
  loading
}) {
  const steps = [
    { id: 'evidence', label: 'Ingest Evidence', num: 1 },
    { id: 'review', label: 'Extraction Review', num: 2 },
    { id: 'timeline', label: 'Timeline & Gaps', num: 3 },
    { id: 'report', label: 'Incident Report', num: 4 },
  ];

  return (
    <header className="no-print" style={{ 
      background: 'var(--surface)', 
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Main bar */}
      <div style={{ 
        maxWidth: 1320, 
        margin: '0 auto', 
        padding: '0 24px',
        height: 56,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ 
            width: 30, height: 30, borderRadius: 6, 
            background: 'var(--green-800)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Shield size={16} color="#fff" />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--green-800)', letterSpacing: '-0.01em' }}>
              Reconstruct
            </div>
            {currentCase && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                Case #{currentCase.id.substring(0, 6).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Center: Stepper (only when a case exists) */}
        {currentCase && (
          <nav className="stepper-nav" style={{ flex: '0 1 auto' }}>
            {steps.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`step-tab ${activeTab === s.id ? 'active' : ''}`}
              >
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                  marginRight: 5,
                  background: activeTab === s.id ? 'var(--green-800)' : 'var(--bg-muted)',
                  color: activeTab === s.id ? '#fff' : 'var(--text-muted)'
                }}>
                  {s.num}
                </span>
                {s.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {currentCase && (
            <button
              onClick={onToggleInvestigatorMode}
              className={`btn btn-sm ${isInvestigatorMode ? 'btn-danger' : 'btn-ghost'}`}
              title="Toggle investigator mode to unmask PII"
            >
              {isInvestigatorMode ? <EyeOff size={14} /> : <Eye size={14} />}
              <span style={{ fontSize: 11 }}>{isInvestigatorMode ? 'Unmasked' : 'Investigator'}</span>
            </button>
          )}

          <button onClick={onSeedCase} disabled={loading} className="btn btn-primary btn-sm" title="Load demo case">
            <Sparkles size={14} />
            <span>Demo</span>
          </button>

          <button onClick={onNewCase} className="btn btn-ghost btn-sm" title="New case">
            <PlusCircle size={14} />
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 28, height: 28, borderRadius: '50%', 
                background: 'var(--green-800)', color: '#fff', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: 12, fontWeight: 700 
              }}>
                {user.email.substring(0, 1).toUpperCase()}
              </div>
              <button onClick={onLogout} className="btn btn-ghost btn-sm" title="Logout">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn btn-primary btn-sm">
              <Lock size={13} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
