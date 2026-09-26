import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import EvidenceUpload from './components/EvidenceUpload';
import ExtractionReview from './components/ExtractionReview';
import TimelineView from './components/TimelineView';
import IncidentReportView from './components/IncidentReportView';
import { api, getToken, clearToken, setToken } from './api';
import { ShieldAlert, Plus, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [currentCase, setCurrentCase] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [timelineData, setTimelineData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isInvestigatorMode, setIsInvestigatorMode] = useState(false);

  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'review' | 'timeline' | 'report'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Initial authentication check & auto-demo setup
  useEffect(() => {
    async function init() {
      const token = getToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          loadCases();
        } catch {
          clearToken();
          autoDemoLogin();
        }
      } else {
        autoDemoLogin();
      }
    }
    init();
  }, []);

  // Provide seamless frictionless demo login
  async function autoDemoLogin() {
    try {
      const email = "investigator.demo@cybercell.gov.in";
      const pwd = "DemoPassword2026!";
      try {
        await api.register(email, pwd);
      } catch {
        // already registered
      }
      const data = await api.login(email, pwd);
      setToken(data.access_token);
      localStorage.setItem('user_email', data.email);
      setUser({ email: data.email, id: data.user_id });
      loadCases();
    } catch (e) {
      console.log("Auto-login fallback note:", e);
    }
  }

  async function loadCases() {
    try {
      setLoading(true);
      const list = await api.listCases();
      setCases(list);
      if (list.length > 0) {
        selectCase(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function selectCase(c) {
    setCurrentCase(c);
    setTimelineData(null);
    setReportData(null);
    try {
      const evs = await api.getEvidence(c.id);
      setEvidenceList(evs);
      // If case already has evidence, proactively try loading timeline
      if (evs.length > 0) {
        try {
          const tData = await api.buildTimeline(c.id);
          setTimelineData(tData);
        } catch {
          // timeline not built yet
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSeedCase() {
    setLoading(true);
    setStatusMessage("Generating comprehensive fraud scenario with crafted gaps & contradictions...");
    try {
      const newCase = await api.seedCase();
      setStatusMessage("Loading evidence artifacts...");
      const list = await api.listCases();
      setCases(list);
      setCurrentCase(newCase);

      const evs = await api.getEvidence(newCase.id);
      setEvidenceList(evs);

      setStatusMessage("Reconciling timeline, detecting temporal gaps and contradictions...");
      const tData = await api.buildTimeline(newCase.id);
      setTimelineData(tData);

      setStatusMessage("Generating redacted incident report...");
      const rep = await api.getReport(newCase.id, false);
      setReportData(rep);

      // Jump directly to timeline for maximum wow-factor!
      setActiveTab('timeline');
    } catch (err) {
      alert("Failed to seed demo case: " + err.message);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  }

  async function handleCreateNewCase() {
    const title = prompt("Enter Case Title (e.g., 'Phishing UPI Debit Incident - A/c 4192'):");
    if (!title || !title.trim()) return;

    try {
      setLoading(true);
      const created = await api.createCase(title.trim(), "Manual forensic investigation");
      const list = await api.listCases();
      setCases(list);
      setCurrentCase(created);
      setEvidenceList([]);
      setTimelineData(null);
      setReportData(null);
      setActiveTab('evidence');
    } catch (err) {
      alert("Failed to create case: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuildTimeline() {
    if (!currentCase) return;
    setLoading(true);
    try {
      const tData = await api.buildTimeline(currentCase.id);
      setTimelineData(tData);
      setActiveTab('timeline');
    } catch (err) {
      alert("Reconciliation error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReport() {
    if (!currentCase) return;
    setLoading(true);
    try {
      const rep = await api.getReport(currentCase.id, false);
      setReportData(rep);
      setActiveTab('report');
    } catch (err) {
      alert("Report generation error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleInvestigatorMode() {
    if (!currentCase) return;
    const nextMode = !isInvestigatorMode;
    setIsInvestigatorMode(nextMode);
    try {
      const rep = await api.getReport(currentCase.id, nextMode);
      setReportData(rep);
    } catch (err) {
      console.error("Failed to toggle investigator mode:", err);
    }
  }

  function handleEvidenceAdded(newItem, fullList) {
    if (fullList) {
      setEvidenceList(fullList);
    } else if (newItem) {
      setEvidenceList(prev => [...prev, newItem]);
    }
    // Update case evidence count
    if (currentCase) {
      setCurrentCase(prev => ({
        ...prev,
        evidence_count: (prev.evidence_count || 0) + (newItem ? 1 : 0)
      }));
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation */}
      <Navbar
        currentCase={currentCase}
        cases={cases}
        onSelectCase={selectCase}
        onNewCase={handleCreateNewCase}
        onSeedCase={handleSeedCase}
        user={user}
        onLogout={() => { clearToken(); setUser(null); }}
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isInvestigatorMode={isInvestigatorMode}
        onToggleInvestigatorMode={handleToggleInvestigatorMode}
        loading={loading}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '28px 24px' }}>
        
        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: '72px', left: 0, right: 0,
            background: 'var(--primary)',
            color: '#fff',
            padding: '8px 20px',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            zIndex: 40,
            boxShadow: '0 4px 12px rgba(13, 59, 36, 0.3)'
          }}>
            <Loader2 size={16} className="animate-spin" />
            <span>{statusMessage || "Processing forensic pipeline..."}</span>
          </div>
        )}

        {/* Case Header if case is selected */}
        {currentCase && (
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase' }}>{currentCase.title}</h1>
                <span className="code-badge" style={{ background: 'var(--primary-container)', color: '#fff' }}>Active Case</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--outline)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Case ID: {currentCase.id} • Created: {new Date(currentCase.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Case selector dropdown if multiple cases exist */}
            {cases.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Switch Case:</span>
                <select
                  value={currentCase.id}
                  onChange={(e) => {
                    const found = cases.find(c => c.id === e.target.value);
                    if (found) selectCase(found);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    background: '#ffffff',
                    color: 'var(--on-surface)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Evidence Ingestion */}
        {activeTab === 'evidence' && currentCase && (
          <EvidenceUpload
            caseId={currentCase.id}
            evidenceList={evidenceList}
            onEvidenceAdded={handleEvidenceAdded}
            onBuildTimeline={handleBuildTimeline}
            onNextToReview={() => setActiveTab('review')}
            loading={loading}
          />
        )}

        {/* Step 2: Extraction Review */}
        {activeTab === 'review' && currentCase && (
          <ExtractionReview
            caseId={currentCase.id}
            evidenceList={evidenceList}
            onUpdateEvidence={(updated) => setEvidenceList(updated)}
            onProceedToTimeline={handleBuildTimeline}
          />
        )}

        {/* Step 3: Reconciled Timeline & Gaps */}
        {activeTab === 'timeline' && currentCase && (
          <TimelineView
            timelineData={timelineData}
            onGenerateReport={handleGenerateReport}
            loading={loading}
          />
        )}

        {/* Step 4: Final Incident Report */}
        {activeTab === 'report' && currentCase && (
          <IncidentReportView
            caseId={currentCase.id}
            initialReport={reportData}
            onRefreshReport={(rep) => setReportData(rep)}
            isInvestigatorMode={isInvestigatorMode}
            onToggleInvestigatorMode={handleToggleInvestigatorMode}
          />
        )}

        {/* Empty state if no case exists */}
        {!currentCase && !loading && (
          <div className="glass-panel" style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 24px var(--primary-glow)' }}>
              <Sparkles size={32} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Welcome to Fraud Forensic Reconstruction</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Convert scattered, unstructured fraud evidence into a structured, privacy-redacted incident report with automated gap and contradiction detection.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleSeedCase}
                className="btn btn-warning"
                style={{ padding: '12px 22px', fontSize: '0.95rem' }}
              >
                <Sparkles size={18} />
                <span>Load 1-Click Demo Case</span>
              </button>
              <button
                onClick={handleCreateNewCase}
                className="btn btn-secondary"
                style={{ padding: '12px 20px', fontSize: '0.95rem' }}
              >
                <Plus size={18} />
                <span>Create Blank Case</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          loadCases();
        }}
      />

    </div>
  );
}
