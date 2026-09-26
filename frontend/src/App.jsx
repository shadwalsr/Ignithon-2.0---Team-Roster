import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import EvidenceUpload from './components/EvidenceUpload';
import ExtractionReview from './components/ExtractionReview';
import TimelineView from './components/TimelineView';
import IncidentReportView from './components/IncidentReportView';
import { api, getToken, clearToken, setToken } from './api';
import { Sparkles, Plus, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [currentCase, setCurrentCase] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [timelineData, setTimelineData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isInvestigatorMode, setIsInvestigatorMode] = useState(false);

  const [activeTab, setActiveTab] = useState('evidence');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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

  async function autoDemoLogin() {
    try {
      const email = "investigator.demo@cybercell.gov.in";
      const pwd = "DemoPassword2026!";
      try { await api.register(email, pwd); } catch { /* already registered */ }
      const data = await api.login(email, pwd);
      setToken(data.access_token);
      localStorage.setItem('user_email', data.email);
      setUser({ email: data.email, id: data.user_id });
      loadCases();
    } catch (e) {
      console.log("Auto-login fallback:", e);
    }
  }

  async function loadCases() {
    try {
      setLoading(true);
      const list = await api.listCases();
      setCases(list);
      if (list.length > 0) selectCase(list[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function selectCase(c) {
    setCurrentCase(c);
    setTimelineData(null);
    setReportData(null);
    try {
      const evs = await api.getEvidence(c.id);
      setEvidenceList(evs);
      if (evs.length > 0) {
        try {
          const tData = await api.buildTimeline(c.id);
          setTimelineData(tData);
        } catch { /* not built yet */ }
      }
    } catch (err) { console.error(err); }
  }

  async function handleSeedCase() {
    setLoading(true);
    setStatusMessage("Generating fraud scenario with gaps & contradictions…");
    try {
      const newCase = await api.seedCase();
      setStatusMessage("Loading evidence artifacts…");
      const list = await api.listCases();
      setCases(list);
      setCurrentCase(newCase);

      const evs = await api.getEvidence(newCase.id);
      setEvidenceList(evs);

      setStatusMessage("Building reconciled timeline…");
      const tData = await api.buildTimeline(newCase.id);
      setTimelineData(tData);

      setStatusMessage("Generating redacted incident report…");
      const rep = await api.getReport(newCase.id, false);
      setReportData(rep);

      setActiveTab('timeline');
    } catch (err) {
      alert("Failed to seed demo case: " + err.message);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  }

  async function handleCreateNewCase() {
    const title = prompt("Enter Case Title:");
    if (!title?.trim()) return;
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
    } catch (err) { alert("Failed: " + err.message); }
    finally { setLoading(false); }
  }

  async function handleBuildTimeline() {
    if (!currentCase) return;
    setLoading(true);
    try {
      const tData = await api.buildTimeline(currentCase.id);
      setTimelineData(tData);
      setActiveTab('timeline');
    } catch (err) { alert("Reconciliation error: " + err.message); }
    finally { setLoading(false); }
  }

  async function handleGenerateReport() {
    if (!currentCase) return;
    setLoading(true);
    try {
      const rep = await api.getReport(currentCase.id, false);
      setReportData(rep);
      setActiveTab('report');
    } catch (err) { alert("Report error: " + err.message); }
    finally { setLoading(false); }
  }

  async function handleToggleInvestigatorMode() {
    if (!currentCase) return;
    const nextMode = !isInvestigatorMode;
    setIsInvestigatorMode(nextMode);
    try {
      const rep = await api.getReport(currentCase.id, nextMode);
      setReportData(rep);
    } catch (err) { console.error("Toggle failed:", err); }
  }

  function handleEvidenceAdded(newItem, fullList) {
    if (fullList) setEvidenceList(fullList);
    else if (newItem) setEvidenceList(prev => [...prev, newItem]);
    if (currentCase && newItem) {
      setCurrentCase(prev => ({
        ...prev,
        evidence_count: (prev.evidence_count || 0) + 1
      }));
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

      {/* Loading Banner */}
      {loading && (
        <div className="loading-banner">
          <Loader2 size={15} className="animate-spin" />
          <span>{statusMessage || "Processing…"}</span>
        </div>
      )}

      <main style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '32px 24px' }}>

        {/* Case Header */}
        {currentCase && (
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{currentCase.title}</h1>
              <p className="mono" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                ID: {currentCase.id.substring(0, 8)} · Created {new Date(currentCase.created_at).toLocaleDateString()}
              </p>
            </div>
            {cases.length > 1 && (
              <select
                className="input input-mono"
                value={currentCase.id}
                onChange={(e) => {
                  const found = cases.find(c => c.id === e.target.value);
                  if (found) selectCase(found);
                }}
                style={{ width: 'auto', maxWidth: 280, fontSize: 12 }}
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Step 1 */}
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

        {/* Step 2 */}
        {activeTab === 'review' && currentCase && (
          <ExtractionReview
            caseId={currentCase.id}
            evidenceList={evidenceList}
            onUpdateEvidence={(updated) => setEvidenceList(updated)}
            onProceedToTimeline={handleBuildTimeline}
          />
        )}

        {/* Step 3 */}
        {activeTab === 'timeline' && currentCase && (
          <TimelineView
            timelineData={timelineData}
            onGenerateReport={handleGenerateReport}
            loading={loading}
          />
        )}

        {/* Step 4 */}
        {activeTab === 'report' && currentCase && (
          <IncidentReportView
            caseId={currentCase.id}
            initialReport={reportData}
            onRefreshReport={(rep) => setReportData(rep)}
            isInvestigatorMode={isInvestigatorMode}
            onToggleInvestigatorMode={handleToggleInvestigatorMode}
          />
        )}

        {/* Empty state */}
        {!currentCase && !loading && (
          <div className="card fade-in" style={{ padding: '80px 32px', textAlign: 'center', maxWidth: 560, margin: '60px auto' }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 14, 
              background: 'var(--green-50)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 20px' 
            }}>
              <Sparkles size={28} color="var(--green-600)" />
            </div>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Fraud Forensic Reconstruction</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
              Convert scattered fraud evidence into a structured, privacy-redacted incident report with automated gap and contradiction detection.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handleSeedCase} className="btn btn-primary">
                <Sparkles size={16} />
                Load Demo Case
              </button>
              <button onClick={handleCreateNewCase} className="btn btn-secondary">
                <Plus size={16} />
                New Case
              </button>
            </div>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => { setUser(u); loadCases(); }}
      />
    </div>
  );
}
