import React from 'react';
import { Shield, Sparkles, PlusCircle, LogOut, Lock, User, FileDown, Eye, EyeOff } from 'lucide-react';

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
  return (
    <header className="sticky top-0 w-full z-50 bg-white border-b border-[#c1c9c0]/40 shadow-[0_1px_8px_rgba(13,59,36,0.05)]">
      
      {/* Top Bar */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(193, 201, 192, 0.3)' }}>
        
        {/* Brand & Case Identification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Logo Mark matching Stitch Specimen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '22px', height: '26px', borderRadius: '2px', background: 'var(--primary-container)', padding: '2px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
              <div style={{ width: '100%', height: '12px', background: 'var(--secondary-container)' }}></div>
              <div style={{ width: '100%', height: '6px', background: '#ffffff' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                RECONSTRUCT
              </span>
              <span className="label-pantone" style={{ color: 'var(--on-surface-variant)', fontSize: '9px', letterSpacing: '0.06em' }}>
                INCIDENT DOSSIER ENGINE
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'rgba(193, 201, 192, 0.5)' }} />

          {/* Active Case Info */}
          {currentCase && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                Case #{currentCase.id.substring(0, 4).toUpperCase()}
              </span>
              <span style={{ color: 'var(--outline)' }}>—</span>
              <span style={{ color: 'var(--on-surface-variant)', fontWeight: 500, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentCase.title}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', border: '1px solid var(--primary-container)', color: 'var(--primary-container)', fontWeight: 700, textTransform: 'uppercase' }}>
                IN RECONCILIATION
              </span>
            </div>
          )}

        </div>

        {/* Right Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Investigator Mode Toggle */}
          <button
            onClick={onToggleInvestigatorMode}
            className="btn-dossier-secondary"
            style={{ fontSize: '11px', padding: '6px 12px', background: isInvestigatorMode ? 'var(--secondary-fixed)' : 'transparent', color: isInvestigatorMode ? 'var(--secondary)' : 'var(--primary)' }}
            title="Reveal unmasked PII values with mandatory audit ledger logging"
          >
            {isInvestigatorMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{isInvestigatorMode ? "Unmasked Active" : "Investigator Mode"}</span>
          </button>

          {/* 1-Click Demo Button */}
          <button
            onClick={onSeedCase}
            disabled={loading}
            className="btn-dossier-primary"
            style={{ fontSize: '11px', padding: '6px 12px' }}
            title="Load ready-made electricity fraud case with 37m gap and ₹5,000 vs ₹5,200 conflict"
          >
            <Sparkles size={14} />
            <span>1-Click Demo</span>
          </button>

          {/* New Case */}
          <button
            onClick={onNewCase}
            className="btn-dossier-secondary"
            style={{ fontSize: '11px', padding: '6px 10px' }}
            title="Create fresh investigation dossier"
          >
            <PlusCircle size={14} />
          </button>

          {/* User profile */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '6px', borderLeft: '1px solid rgba(193, 201, 192, 0.4)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                {user.email.substring(0, 1).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="btn-dossier-secondary"
                style={{ padding: '5px 8px', border: 'none' }}
                title="Logout"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-dossier-primary"
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              <Lock size={13} />
              <span>Login</span>
            </button>
          )}

        </div>

      </div>

      {/* Stepper Navigation Ribbon matching Stitch Screen 1 */}
      {currentCase && (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto' }}>
          <nav style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`stepper-tab ${activeTab === 'evidence' ? 'active' : ''}`}
            >
              1. Ingest Evidence ({currentCase.evidence_count || 0})
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`stepper-tab ${activeTab === 'review' ? 'active' : ''}`}
            >
              2. Extraction Review
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`stepper-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            >
              3. Reconciliation & Timeline
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`stepper-tab ${activeTab === 'report' ? 'active' : ''}`}
            >
              4. Final Incident Report
            </button>
          </nav>
          <div className="code-badge" style={{ color: 'var(--outline)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ARCHIVE SPECIMEN // FORENSIC INTEGRITY: SECURE
          </div>
        </div>
      )}

      {/* Persistent Legal Top Ribbon matching Stitch */}
      <div style={{ background: 'var(--primary-container)', color: '#ffffff', padding: '5px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--secondary-container)' }}></span>
            <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>LEGAL PIPELINE: ACQUISITION STAGE 1.0</span>
          </div>
          <span style={{ opacity: 0.4 }}>|</span>
          <span className="label-pantone" style={{ color: 'var(--on-primary-container)', fontSize: '10px' }}>
            LEGAL HOLD HASH: SHA256:8f921...c4b
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ color: 'var(--on-primary-container)' }}>
            EVIDENCE VAULT: AES-256 ZERO-PERSISTENCE PII REDACTOR ACTIVE
          </span>
          <span style={{ background: 'rgba(255,255,255,0.12)', padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 600 }}>
            SESSION: 00:44:12
          </span>
        </div>
      </div>

    </header>
  );
}
