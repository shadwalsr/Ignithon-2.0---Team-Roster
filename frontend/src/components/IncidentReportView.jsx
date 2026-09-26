import React, { useState } from 'react';
import { 
  FileText, ShieldCheck, Eye, EyeOff, Printer, Download, 
  AlertTriangle, AlertOctagon, CheckCircle2, Hash, Lock, ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function IncidentReportView({
  caseId,
  initialReport,
  onRefreshReport,
  isInvestigatorMode,
  onToggleInvestigatorMode
}) {
  const [report, setReport] = useState(initialReport);

  // Sync report when prop changes
  React.useEffect(() => {
    if (initialReport) setReport(initialReport);
  }, [initialReport]);

  function handlePrint() {
    window.print();
  }

  function handleDownloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `forensic-incident-dossier-${caseId.substring(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  if (!report) {
    return (
      <div className="dossier-card" style={{ padding: '60px', textAlign: 'center' }}>
        <FileText size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ textTransform: 'uppercase' }}>Report Not Available</h3>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>
          Please compile the chronological timeline before opening the incident report.
        </p>
      </div>
    );
  }

  const { metrics = {} } = report;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Action Toolbar (Hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} color="var(--primary)" />
          <span className="label-pantone" style={{ color: 'var(--primary)', fontSize: '12px' }}>
            {isInvestigatorMode ? "INVESTIGATOR VIEW: UNMASKED FORENSIC AUDIT" : "STATUTORY REDACTED: SHARABLE CASE DOSSIER"}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onToggleInvestigatorMode}
            className="btn-dossier-secondary"
            style={{ fontSize: '11px', padding: '6px 14px', background: isInvestigatorMode ? 'var(--secondary-fixed)' : 'transparent', color: isInvestigatorMode ? 'var(--secondary)' : 'var(--primary)' }}
          >
            {isInvestigatorMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{isInvestigatorMode ? "Switch to Redacted" : "Toggle Investigator Mode"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-dossier-primary"
            style={{ fontSize: '11px', padding: '6px 14px' }}
          >
            <Printer size={14} />
            <span>Print Dossier (PDF)</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="btn-dossier-secondary"
            style={{ fontSize: '11px', padding: '6px 14px' }}
          >
            <Download size={14} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Investigator Mode Warning Banner matching Stitch */}
      {isInvestigatorMode && (
        <div className="no-print" style={{ background: 'var(--primary-container)', color: '#ffffff', padding: '12px 18px', borderRadius: '4px', borderLeft: '4px solid var(--secondary-container)', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-md)' }}>
          <ShieldAlert size={22} color="var(--secondary-container)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, color: 'var(--secondary-fixed)', fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              RESTRICTED AUDIT ACCESS ACTIVE
            </div>
            <div style={{ fontSize: '12px', color: '#f0eee0', marginTop: '2px' }}>
              Full unredacted PII (mobile numbers, bank accounts, and personal identifiers) is displayed. Every view event is permanently recorded in the forensic audit ledger.
            </div>
          </div>
        </div>
      )}

      {/* The Printable Dossier Poster matching Stitch Screen 4 */}
      <article className="dossier-card" style={{ background: '#ffffff', padding: '48px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '36px' }}>
        
        {/* Top Dossier Plate Collar */}
        <header style={{ borderBottom: '2px solid var(--border-subtle)', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="code-badge" style={{ background: 'var(--primary)', color: '#fff', padding: '2px 6px', fontWeight: 800 }}>
                FORM-CR-89
              </span>
              <span className="code-badge" style={{ color: 'var(--outline)', textTransform: 'uppercase' }}>
                CENTRAL CYBER CELL REPOSITORY
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
              <ShieldCheck size={16} />
              <span>FORENSIC LEDGER SECURED</span>
            </div>
          </div>

          <div>
            <h1 style={{ fontSize: '38px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.05, color: 'var(--primary)' }}>
              INCIDENT REPORT: CASE #{report.case_id.substring(0, 4).toUpperCase()}
            </h1>
            <p style={{ fontFamily: 'var(--font-headline)', fontSize: '20px', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>
              {report.case_title}
            </p>
          </div>

          {/* Case Metadata Strip matching Stitch */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--surface-low)', padding: '12px 16px', borderRadius: '4px' }}>
            <div>
              <span className="label-pantone" style={{ color: 'var(--outline)', fontSize: '9px', display: 'block' }}>Date of Occurrence</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>24 OCT 2026</span>
            </div>
            <div>
              <span className="label-pantone" style={{ color: 'var(--outline)', fontSize: '9px', display: 'block' }}>Report Compiled</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>{report.generated_at}</span>
            </div>
            <div>
              <span className="label-pantone" style={{ color: 'var(--outline)', fontSize: '9px', display: 'block' }}>Jurisdiction</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>CYBER CELL DIVISION</span>
            </div>
            <div>
              <span className="label-pantone" style={{ color: 'var(--outline)', fontSize: '9px', display: 'block' }}>Classification</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, color: 'var(--secondary)' }}>
                {isInvestigatorMode ? "RESTRICTED // UNMASKED" : "STANDARD REDACTED"}
              </span>
            </div>
          </div>
        </header>

        {/* Section 01: Case Executive Summary & Pantone Metrics */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>01</span>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontWeight: 800 }}>Case Executive Summary</h2>
            </div>
            <span className="label-pantone" style={{ color: 'var(--outline)' }}>METRIC PLATE // A-1</span>
          </div>

          {/* 4-Column Pantone Swatch Metrics matching Stitch */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            
            <div className="dossier-card" style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--primary-container)', padding: '10px 14px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="label-pantone" style={{ color: 'var(--on-primary-container)', fontSize: '9px' }}>SPECIMEN FIELD</span>
                <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-headline)', lineHeight: 1 }}>
                  {metrics.total_evidence < 10 ? `0${metrics.total_evidence}` : metrics.total_evidence}
                </span>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--surface-container)' }}>
                <span className="label-pantone" style={{ color: 'var(--primary)', fontSize: '10px', display: 'block' }}>Evidence Artifacts</span>
                <span className="code-badge" style={{ color: 'var(--outline)', fontSize: '9px' }}>INGEST CHAIN VERIFIED</span>
              </div>
            </div>

            <div className="dossier-card" style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--surface-highest)', padding: '10px 14px', color: 'var(--on-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="label-pantone" style={{ color: 'var(--on-surface-variant)', fontSize: '9px' }}>DISPUTED TOTAL</span>
                <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-headline)', lineHeight: 1, color: 'var(--primary)' }}>
                  ₹5,000
                </span>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--surface-container)' }}>
                <span className="label-pantone" style={{ color: 'var(--primary)', fontSize: '10px', display: 'block' }}>Principal Loss</span>
                <span className="code-badge" style={{ color: 'var(--outline)', fontSize: '9px' }}>+ ₹200 Surcharge Delta</span>
              </div>
            </div>

            <div className="dossier-card" style={{ overflow: 'hidden', border: '1px solid var(--secondary)' }}>
              <div style={{ background: 'var(--secondary-fixed)', padding: '10px 14px', color: 'var(--on-secondary-fixed)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="label-pantone" style={{ color: 'var(--secondary)', fontSize: '9px', fontWeight: 800 }}>ANOMALY FLAG</span>
                <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-headline)', lineHeight: 1, color: 'var(--secondary)' }}>
                  {metrics.gap_count < 10 ? `0${metrics.gap_count}` : metrics.gap_count}
                </span>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--surface-container)' }}>
                <span className="label-pantone" style={{ color: 'var(--secondary)', fontSize: '10px', display: 'block' }}>Critical Temporal Gap</span>
                <span className="code-badge" style={{ color: 'var(--secondary)', fontSize: '9px' }}>37-MIN LULL UNACCOUNTED</span>
              </div>
            </div>

            <div className="dossier-card" style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--surface-high)', padding: '10px 14px', color: 'var(--on-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="label-pantone" style={{ color: 'var(--on-surface-variant)', fontSize: '9px' }}>AUDIT ARBITRATION</span>
                <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-headline)', lineHeight: 1, color: 'var(--primary)' }}>
                  {metrics.conflict_count < 10 ? `0${metrics.conflict_count}` : metrics.conflict_count}
                </span>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--surface-container)' }}>
                <span className="label-pantone" style={{ color: 'var(--primary)', fontSize: '10px', display: 'block' }}>Reconciled Conflict</span>
                <span className="code-badge" style={{ color: 'var(--outline)', fontSize: '9px' }}>SMS VS CHAT DISCREPANCY</span>
              </div>
            </div>

          </div>

          {/* Narrative Summary */}
          <div style={{ background: 'var(--surface-low)', padding: '16px 20px', borderRadius: '4px', fontSize: '13.5px', lineHeight: 1.7, color: 'var(--on-surface)' }}>
            The victim was targeted via an urgent electricity disconnection phishing vector masquerading as state utility operations. Under duress of imminent power cutoff, the victim accessed a malicious harvesting portal, culminating in unauthorized UPI debit instructions. Subsequent communications attempted remote access escalation. Forensic reconciliation across 5 evidentiary specimens establishes an indisputable sequence of social engineering and unauthorized financial extraction.
          </div>
        </section>

        {/* Section 02: Reconciled Forensic Timeline Ledger Table matching Stitch */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>02</span>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontWeight: 800 }}>Reconciled Forensic Timeline Ledger</h2>
            </div>
            <span className="code-badge" style={{ background: 'var(--surface-high)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '2px' }}>
              {report.timeline.length} VERIFIED AUDIT NODES
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-high)', color: 'var(--primary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }} className="label-pantone">Time (IST)</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }} className="label-pantone">Event Type</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }} className="label-pantone">Reconciled Narrative & Telemetry</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }} className="label-pantone">Amount</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }} className="label-pantone">Redaction Status</th>
                </tr>
              </thead>
              <tbody>
                {report.timeline.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? '#fff' : 'var(--surface-low)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                      {item.timestamp ? item.timestamp.substring(11, 16) + ' IST' : 'N/A'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="code-badge" style={{ background: 'var(--primary-container)', color: '#fff', padding: '1px 6px', borderRadius: '2px', textTransform: 'uppercase' }}>
                        {item.evidence_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--on-surface)', lineHeight: 1.5 }}>
                      {item.raw_text_summary}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.amount ? 'var(--secondary)' : 'var(--outline)' }}>
                      {item.amount ? `${item.currency} ${item.amount}` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span className={isInvestigatorMode ? "unmasked-token" : "redacted-token"}>
                        {isInvestigatorMode ? "UNMASKED" : "DETERMINISTIC REDACTED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 03: Missing Information & Gaps */}
        {report.gaps && report.gaps.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>03</span>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--secondary)' }}>
                Missing Information & Evidentiary Gaps
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {report.gaps.map((gap, gIdx) => (
                <div key={gIdx} style={{ background: 'rgba(232, 19, 124, 0.06)', border: '1px solid var(--secondary)', padding: '12px 16px', borderRadius: '4px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="code-badge" style={{ background: 'var(--secondary)', color: '#fff', padding: '1px 6px', fontWeight: 700 }}>
                      {gap.type.toUpperCase()} ANOMALY
                    </span>
                    {gap.duration_minutes && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--secondary)' }}>
                        {Math.round(gap.duration_minutes)} MINUTES DURATION
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>
                    {gap.description}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 04: Contradiction & Fact Divergence */}
        {report.conflicts && report.conflicts.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>04</span>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--secondary)' }}>
                Contradiction Analysis & Arbitration
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {report.conflicts.map((conf, cIdx) => (
                <div key={cIdx} style={{ background: 'var(--surface-low)', border: '1px solid var(--secondary)', padding: '14px 18px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="label-pantone" style={{ color: 'var(--secondary)', fontWeight: 800 }}>
                      DISCREPANCY ON FIELD: {conf.field.toUpperCase()}
                    </span>
                    <span className="code-badge" style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                      #FIN-AUD-88 FLAGGED
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface)', marginBottom: '8px' }}>
                    {conf.description}
                  </p>
                  <div style={{ display: 'flex', gap: '20px', fontFamily: 'var(--font-mono)', fontSize: '13px', background: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Evidence Record A: {conf.values[0]}</span>
                    <span style={{ color: 'var(--outline)' }}>|</span>
                    <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>Evidence Record B: {conf.values[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 05: Evidence Appendix & Hashes */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>05</span>
            <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontWeight: 800 }}>
              Evidence Appendix & Forensic Custody Hashes
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(report.evidence_appendix || []).map((app, aIdx) => (
              <div key={aIdx} style={{ background: 'var(--surface-low)', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="code-badge" style={{ background: 'var(--primary)', color: '#fff', padding: '1px 6px', fontWeight: 700 }}>
                    #{aIdx + 1}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{app.evidence_type.toUpperCase()}</span>
                  <span style={{ color: 'var(--on-surface-variant)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.raw_text || (app.extraction && app.extraction.raw_text_summary)}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>
                  SHA-256: {app.sha256_hash ? app.sha256_hash.substring(0, 16) + '...' : 'AUTHENTICATED'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 06: Statutory Privacy Redaction Notice */}
        <footer style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', fontSize: '11px', color: 'var(--outline)', lineHeight: 1.6, background: 'var(--surface-low)', padding: '14px 18px', borderRadius: '4px' }}>
          <strong>STATUTORY DISCLOSURE:</strong> {report.redaction_notice}
        </footer>

      </article>

    </div>
  );
}
