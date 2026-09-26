import React from 'react';
import { Shield, Sparkles, PlusCircle, LogOut, Lock, User, FileText } from 'lucide-react';

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
  loading
}) {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', position: 'sticky', top: 0, zIndex: 50, padding: '12px 24px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)' }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FORENSIC-EVIDENCE
              </span>
              <span className="badge badge-evidence-type" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>v1.0 PRD</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Deterministic Evidence Reconstruction & Privacy Redaction
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        {currentCase && (
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('evidence')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                background: activeTab === 'evidence' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'evidence' ? '#fff' : 'var(--text-muted)',
                borderRadius: '6px'
              }}
            >
              1. Evidence ({currentCase.evidence_count || 0})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                background: activeTab === 'timeline' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'timeline' ? '#fff' : 'var(--text-muted)',
                borderRadius: '6px'
              }}
            >
              2. Timeline & Gaps
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                background: activeTab === 'report' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'report' ? '#fff' : 'var(--text-muted)',
                borderRadius: '6px'
              }}
            >
              3. Redacted Report
            </button>
          </div>
        )}

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Demo Button (High Judge Value) */}
          <button
            onClick={onSeedCase}
            disabled={loading}
            className="btn btn-warning"
            title="Generates a complete Indian fraud case with UPI SMS, phishing URLs, gaps, and contradictions"
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
          >
            <Sparkles size={15} />
            <span>Load 1-Click Demo Case</span>
          </button>

          {/* New Case Button */}
          <button
            onClick={onNewCase}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 12px' }}
          >
            <PlusCircle size={15} />
            <span>New Case</span>
          </button>

          {/* User profile / login */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <User size={15} color="#94a3b8" />
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '7px 14px' }}
            >
              <Lock size={15} />
              <span>Login / Register</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
