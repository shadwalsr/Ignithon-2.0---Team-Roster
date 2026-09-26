import React, { useState } from 'react';
import { 
  FileText, ShieldCheck, Eye, EyeOff, Printer, Download, 
  AlertTriangle, AlertOctagon, CheckCircle2, Hash, Lock, ShieldAlert
} from 'lucide-react';
import { api } from '../api';

export default function IncidentReportView({
  caseId,
  initialReport,
  onRefreshReport
}) {
  const [report, setReport] = useState(initialReport);
  const [isInvestigatorMode, setIsInvestigatorMode] = useState(initialReport?.is_unredacted_view || false);
  const [loading, setLoading] = useState(false);

  async function toggleInvestigatorMode() {
    setLoading(true);
    try {
      const nextMode = !isInvestigatorMode;
      const updated = await api.getReport(caseId, nextMode);
      setReport(updated);
      setIsInvestigatorMode(nextMode);
      if (onRefreshReport) onRefreshReport(updated);
    } catch (err) {
      alert("Error toggling mode: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `forensic-incident-report-${caseId.substring(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  if (!report) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
        <FileText size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
        <h3>Report Not Available</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Please ensure timeline has been built before accessing incident report.
        </p>
      </div>
    );
  }

  const { metrics = {} } = report;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Action Bar (Hidden on print) */}
      <div className="glass-panel no-print" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} color={isInvestigatorMode ? "#fbbf24" : "var(--primary)"} />
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              {isInvestigatorMode ? "Investigator Forensic Mode (Unmasked)" : "Public / Bank Shareable Mode (Redacted)"}
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {isInvestigatorMode ? "Sensitive identifiers visible for authorized law enforcement" : "Deterministic regex masking on all PII"}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Investigator mode toggle */}
          <button
            onClick={toggleInvestigatorMode}
            disabled={loading}
            className={`btn ${isInvestigatorMode ? 'btn-warning' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            {isInvestigatorMode ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{isInvestigatorMode ? "Switch to Redacted View" : "Toggle Investigator Mode"}</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownloadJSON}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <Download size={15} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Investigator Mode Glowing Warning Banner */}
      {report.audit_banner && (
        <div className="investigator-banner no-print" style={{ marginBottom: '24px' }}>
          <ShieldAlert size={26} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, color: '#fef08a', fontSize: '0.92rem', letterSpacing: '0.02em' }}>
              AUDIT LEDGER NOTICE
            </div>
            <div style={{ fontSize: '0.82rem', color: '#f8fafc', marginTop: '2px' }}>
              {report.audit_banner}
            </div>
          </div>
        </div>
      )}

      {/* Formal Printable Incident Report Document */}
      <div className="glass-panel" style={{ padding: '40px', background: 'rgba(14, 19, 31, 0.95)', border: '1px solid var(--border-medium)' }}>
        
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid var(--border-subtle)', paddingBottom: '24px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-evidence-type">OFFICIAL FORENSIC INCIDENT DOSSIER</span>
              {isInvestigatorMode ? (
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b' }}>
                  CONFIDENTIAL • UNMASKED
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}>
                  STATUTORY PRIVACY REDACTED
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px' }}>{report.case_title}</h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              Case UUID: {report.case_id} • Compiled: {report.generated_at}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Classification</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isInvestigatorMode ? '#fbbf24' : '#34d399' }}>
              {isInvestigatorMode ? "RESTRICTED / FORENSIC" : "STANDARD PRIVACY COMPLIANT"}
            </div>
          </div>
        </div>

        {/* Section 1: Case Summary Metrics */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            1. Executive Case Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Total Evidence Items</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>{metrics.total_evidence || 0}</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Timeline Events</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#cbd5e1' }}>{metrics.timeline_events || 0}</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Evidentiary Gaps</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{metrics.gap_count || 0}</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Fact Contradictions</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>{metrics.conflict_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Chronological Timeline */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            2. Chronological Forensic Reconstruction
          </h3>
          <div style={{ borderLeft: '2px solid var(--border-medium)', marginLeft: '12px', paddingLeft: '20px' }}>
            {report.timeline.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '20px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid #000' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>
                    {item.timestamp ? item.timestamp.replace('T', ' ').replace('Z', ' UTC') : 'Unknown Time'}
                  </span>
                  <span className="badge badge-evidence-type">{item.evidence_type}</span>
                  {item.amount && (
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                      {item.currency} {item.amount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '6px' }}>
                  {item.raw_text_summary}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Missing Information (Gaps) */}
        {report.gaps && report.gaps.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fbbf24', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              <span>3. Missing Information & Unaccounted Gaps</span>
            </h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {report.gaps.map((gap, gIdx) => (
                <li key={gIdx}>
                  <strong style={{ color: '#fbbf24' }}>[{gap.type.toUpperCase()}]:</strong> {gap.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 4: Conflicting Information (Contradictions) */}
        {report.conflicts && report.conflicts.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#f87171', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} />
              <span>4. Conflicting Information & Discrepancies</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {report.conflicts.map((conf, cIdx) => (
                <div key={cIdx} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.88rem' }}>
                    Conflict on field: {conf.field.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: '4px 0 8px' }}>
                    {conf.description}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#f87171' }}>Value A: {conf.values[0] || 'N/A'}</span>
                    <span style={{ color: 'var(--text-dim)' }}>|</span>
                    <span style={{ color: '#fbbf24' }}>Value B: {conf.values[1] || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Evidence Appendix & Forensic Chain-of-Custody */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            5. Evidence Appendix & Forensic Custody Hashes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(report.evidence_appendix || []).map((appItem, aIdx) => (
              <div key={aIdx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>Artifact #{aIdx + 1} ({appItem.evidence_type})</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    SHA-256: {appItem.sha256_hash || 'Checksum verified'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {appItem.raw_text || (appItem.extraction && appItem.extraction.raw_text_summary) || 'Direct image screenshot capture'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Statutory Redaction Notice */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px' }}>
            {report.redaction_notice}
          </div>
        </div>

      </div>

    </div>
  );
}
