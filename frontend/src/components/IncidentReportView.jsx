import React, { useState } from 'react';
import { FileText, Eye, EyeOff, Printer, Download, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function IncidentReportView({
  caseId,
  initialReport,
  onRefreshReport,
  isInvestigatorMode,
  onToggleInvestigatorMode
}) {
  const [report, setReport] = useState(initialReport);

  React.useEffect(() => {
    if (initialReport) setReport(initialReport);
  }, [initialReport]);

  function handlePrint() { window.print(); }

  function handleDownloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `incident-report-${caseId.substring(0, 8)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (!report) {
    return (
      <div className="card fade-in" style={{ padding: 60, textAlign: 'center' }}>
        <FileText size={36} color="var(--green-600)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 18 }}>Report Not Available</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Build the timeline first, then generate the incident report.
        </p>
      </div>
    );
  }

  const { metrics = {} } = report;

  return (
    <div className="fade-in" style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toolbar */}
      <div className="no-print card" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} color="var(--green-600)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {isInvestigatorMode ? "Investigator View — Unmasked" : "Redacted — Shareable"}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onToggleInvestigatorMode} className={`btn btn-sm ${isInvestigatorMode ? 'btn-danger' : 'btn-secondary'}`}>
            {isInvestigatorMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {isInvestigatorMode ? 'Hide PII' : 'Show PII'}
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={14} /> Print
          </button>
          <button onClick={handleDownloadJSON} className="btn btn-secondary btn-sm">
            <Download size={14} /> JSON
          </button>
        </div>
      </div>

      {/* Investigator warning */}
      {isInvestigatorMode && (
        <div className="no-print" style={{
          background: 'var(--pink-50)', border: '1px solid var(--pink-100)',
          borderLeft: '4px solid var(--pink-500)', borderRadius: 'var(--radius-md)',
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <ShieldAlert size={20} color="var(--pink-600)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--pink-700)', fontSize: 13 }}>Restricted Audit Access</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Full unredacted PII is displayed. Every access is logged in the audit ledger.
            </div>
          </div>
        </div>
      )}

      {/* The Report Document */}
      <article className="card" style={{ padding: '40px 44px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Header */}
        <header style={{ borderBottom: '2px solid var(--border)', paddingBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-green" style={{ fontSize: 11, fontWeight: 700 }}>Form CR-89</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cyber Cell Repository</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green-600)' }}>
              <CheckCircle2 size={14} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>Forensic Secured</span>
            </div>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, marginBottom: 4 }}>
            Incident Report
          </h1>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--green-700)', fontWeight: 700 }}>
            {report.case_title}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
            {[
              { label: 'Date', value: '26 Sep 2026' },
              { label: 'Compiled', value: report.generated_at },
              { label: 'Division', value: 'Cyber Cell' },
              { label: 'Classification', value: isInvestigatorMode ? 'Unmasked' : 'Redacted', highlight: isInvestigatorMode },
            ].map((m, i) => (
              <div key={i}>
                <span className="label" style={{ display: 'block', fontSize: 10 }}>{m.label}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: m.highlight ? 'var(--pink-600)' : 'var(--text)' }}>{m.value}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Section 01: Summary */}
        <section>
          <SectionHeading num="01" title="Case Summary" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <StatBlock label="Evidence Items" value={metrics.total_evidence < 10 ? `0${metrics.total_evidence}` : metrics.total_evidence} color="var(--green-800)" />
            <StatBlock label="Total Loss" value="₹5,000" sub="+₹200 delta" color="var(--green-800)" />
            <StatBlock label="Temporal Gaps" value={metrics.gap_count < 10 ? `0${metrics.gap_count}` : metrics.gap_count} color="var(--pink-600)" accent />
            <StatBlock label="Conflicts" value={metrics.conflict_count < 10 ? `0${metrics.conflict_count}` : metrics.conflict_count} color="var(--text-secondary)" />
          </div>
          <div className="card-flat" style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)' }}>
            The victim was targeted via an urgent electricity disconnection phishing vector masquerading as state utility operations. Under duress of imminent power cutoff, the victim accessed a malicious harvesting portal, culminating in unauthorized UPI debit instructions. Subsequent communications attempted remote access escalation. Forensic reconciliation across {metrics.total_evidence || 5} evidentiary specimens establishes an indisputable sequence of social engineering and unauthorized financial extraction.
          </div>
        </section>

        {/* Section 02: Timeline Ledger */}
        <section>
          <SectionHeading num="02" title="Reconciled Timeline" count={`${report.timeline.length} events`} />
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                  <th className="label" style={{ padding: '8px 12px' }}>Time</th>
                  <th className="label" style={{ padding: '8px 12px' }}>Type</th>
                  <th className="label" style={{ padding: '8px 12px' }}>Details</th>
                  <th className="label" style={{ padding: '8px 12px' }}>Amount</th>
                  <th className="label" style={{ padding: '8px 12px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.timeline.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? '#fff' : 'var(--surface-sunken)' }}>
                    <td className="mono" style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--green-800)', whiteSpace: 'nowrap' }}>
                      {item.timestamp ? item.timestamp.substring(11, 16) + ' IST' : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="badge badge-green" style={{ fontSize: 10, textTransform: 'uppercase' }}>{item.evidence_type}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text)', lineHeight: 1.5, maxWidth: 400 }}>
                      {item.raw_text_summary}
                    </td>
                    <td className="mono" style={{ padding: '10px 12px', fontWeight: 700, color: item.amount ? 'var(--pink-600)' : 'var(--text-faint)' }}>
                      {item.amount ? `${item.currency} ${item.amount}` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span className={`badge ${isInvestigatorMode ? 'badge-pink' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                        {isInvestigatorMode ? "Unmasked" : "Redacted"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 03: Gaps */}
        {report.gaps?.length > 0 && (
          <section>
            <SectionHeading num="03" title="Evidentiary Gaps" accent />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.gaps.map((gap, gIdx) => (
                <div key={gIdx} style={{ background: 'var(--pink-50)', border: '1px solid var(--pink-100)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-pink" style={{ fontSize: 10 }}>{gap.type}</span>
                    {gap.duration_minutes && (
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--pink-600)', fontSize: 12 }}>
                        {Math.round(gap.duration_minutes)} min
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text)', lineHeight: 1.5 }}>{gap.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 04: Conflicts */}
        {report.conflicts?.length > 0 && (
          <section>
            <SectionHeading num="04" title="Contradictions" accent />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {report.conflicts.map((conf, cIdx) => (
                <div key={cIdx} className="card-flat" style={{ padding: '14px 18px', borderColor: 'var(--pink-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--pink-700)', fontSize: 13 }}>
                      Field: {conf.field}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 10 }}>{conf.description}</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, background: 'var(--surface)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <span className="label" style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Source A</span>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--green-800)' }}>{conf.values[0]}</span>
                    </div>
                    <div style={{ flex: 1, background: 'var(--surface)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--pink-100)' }}>
                      <span className="label" style={{ fontSize: 10, display: 'block', marginBottom: 2, color: 'var(--pink-700)' }}>Source B</span>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--pink-600)' }}>{conf.values[1]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 05: Evidence Appendix */}
        <section>
          <SectionHeading num="05" title="Evidence Appendix" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(report.evidence_appendix || []).map((app, aIdx) => (
              <div key={aIdx} className="card-flat" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-green" style={{ padding: '2px 6px' }}>#{aIdx + 1}</span>
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--green-700)' }}>{app.evidence_type}</span>
                  <span style={{ color: 'var(--text-muted)', maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.raw_text || app.extraction?.raw_text_summary}
                  </span>
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                  SHA: {app.sha256_hash ? app.sha256_hash.substring(0, 16) + '…' : '—'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="card-flat" style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong>Statutory Disclosure:</strong> {report.redaction_notice}
        </footer>

      </article>
    </div>
  );
}

/* ─── Helper Components ─── */

function SectionHeading({ num, title, count, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: accent ? 'var(--pink-600)' : 'var(--green-700)' }}>{num}</span>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>{title}</h2>
      </div>
      {count && <span className="badge badge-neutral">{count}</span>}
    </div>
  );
}

function StatBlock({ label, value, sub, color, accent }) {
  return (
    <div className="stat-card" style={{ borderColor: accent ? 'var(--pink-100)' : 'var(--border)' }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color }}>{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
