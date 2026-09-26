import React from 'react';
import { 
  Clock, AlertTriangle, AlertOctagon, HelpCircle, 
  ArrowRight, ShieldAlert, CheckCircle, Split, FileCheck
} from 'lucide-react';

export default function TimelineView({
  timelineData,
  onGenerateReport,
  loading
}) {
  if (!timelineData) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
        <Clock size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
        <h3>No Timeline Assembled Yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
          Please ingest evidence items first and click "Build Reconciled Timeline".
        </p>
      </div>
    );
  }

  const { timeline = [], unplaced_items = [], gaps = [], conflicts = [], metrics = {} } = timelineData;

  // Map temporal gaps to the evidence ID they appear after
  const gapsByPrecedingId = {};
  gaps.forEach((g) => {
    if (g.type === "temporal" && g.between && g.between[0]) {
      gapsByPrecedingId[g.between[0]] = g;
    }
  });

  // Map conflicts to evidence IDs
  const conflictsByEvidenceId = {};
  conflicts.forEach((c) => {
    (c.evidence_ids || []).forEach((id) => {
      if (!conflictsByEvidenceId[id]) conflictsByEvidenceId[id] = [];
      conflictsByEvidenceId[id].push(c);
    });
  });

  return (
    <div>
      {/* Top Forensic Summary Bar */}
      <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline Events</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{metrics.timeline_events || 0}</div>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected Gaps</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{metrics.gap_count || 0}</div>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contradictions</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>{metrics.conflict_count || 0}</div>
          </div>
          {unplaced_items.length > 0 && (
            <>
              <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unplaced</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#94a3b8' }}>{unplaced_items.length}</div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onGenerateReport}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '10px 22px', fontSize: '0.92rem' }}
        >
          <FileCheck size={18} />
          <span>Generate Redacted Incident Report</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Structural Gaps Alert if present */}
      {gaps.filter(g => g.type === "structural").map((sg, idx) => (
        <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.9rem' }}>Structural Evidence Gap Detected</div>
            <div style={{ fontSize: '0.82rem', color: '#fef3c7', marginTop: '2px' }}>{sg.description}</div>
          </div>
        </div>
      ))}

      {/* Interactive Timeline Core */}
      <div className="timeline-container">
        <div className="timeline-line" />

        {timeline.map((item, index) => {
          const gapAfter = gapsByPrecedingId[item.evidence_id];
          const hasConflict = conflictsByEvidenceId[item.evidence_id] && conflictsByEvidenceId[item.evidence_id].length > 0;

          const formattedTime = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
          const formattedDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '';

          return (
            <React.Fragment key={item.evidence_id || index}>
              
              {/* Timeline Card */}
              <div className="timeline-item">
                <div className="timeline-dot">
                  <Clock size={10} color="var(--primary)" />
                </div>

                <div className="glass-panel" style={{ padding: '20px', borderLeft: hasConflict ? '3px solid var(--danger)' : '3px solid var(--primary)' }}>
                  
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: '#38bdf8' }}>
                        {formattedTime}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {formattedDate}
                      </span>
                      <span className="badge badge-evidence-type">
                        {item.evidence_type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.extraction_confidence && (
                        <span className={`badge badge-confidence-${item.extraction_confidence}`}>
                          {item.extraction_confidence} Conf
                        </span>
                      )}
                      {hasConflict && (
                        <span className="badge" style={{ background: 'var(--danger-bg)', color: '#f87171', border: '1px solid var(--danger-border)' }}>
                          <Split size={12} /> Conflict Detected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '12px' }}>
                    {item.raw_text_summary}
                  </p>

                  {/* Key metadata pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem' }}>
                    {item.amount !== null && item.amount !== undefined && (
                      <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: 600 }}>
                        Amount: {item.currency} {item.amount}
                      </span>
                    )}
                    {item.transaction_id && (
                      <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', padding: '3px 8px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
                        Ref: {item.transaction_id}
                      </span>
                    )}
                    {item.sender && (
                      <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', padding: '3px 8px', borderRadius: '6px' }}>
                        Originator: {item.sender}
                      </span>
                    )}
                    {item.phone_numbers && item.phone_numbers.length > 0 && (
                      <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', padding: '3px 8px', borderRadius: '6px' }}>
                        Contact: {item.phone_numbers.join(', ')}
                      </span>
                    )}
                    {item.urls && item.urls.length > 0 && (
                      <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '3px 8px', borderRadius: '6px' }}>
                        URL: {item.urls[0]}
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {/* Temporal Gap Marker (If detected immediately after this event) */}
              {gapAfter && (
                <div className="gap-marker">
                  <div className="gap-marker-dot" />
                  <AlertTriangle size={18} color="#fbbf24" />
                  <div>
                    <strong>TEMPORAL GAP:</strong> {gapAfter.description}
                  </div>
                </div>
              )}

            </React.Fragment>
          );
        })}
      </div>

      {/* Side-by-Side Contradiction Cards Section */}
      {conflicts.length > 0 && (
        <div style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <AlertOctagon size={22} color="var(--danger)" />
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#f87171' }}>Forensic Contradiction Analysis ({conflicts.length})</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                The engine detects factual disagreements across correlated events without picking a winner.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {conflicts.map((conf, cIdx) => (
              <div key={conf.conflict_id || cIdx} className="conflict-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.95rem' }}>
                    Contradiction on field: <span style={{ textTransform: 'uppercase', textDecoration: 'underline' }}>{conf.field}</span>
                  </div>
                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
                    Event Correlation Discrepancy
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '8px 0 12px' }}>
                  {conf.description}
                </p>

                <div className="conflict-split">
                  <div className="conflict-branch">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>
                      Evidence Record #A
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      {conf.values[0] || 'Unstated'}
                    </div>
                  </div>
                  <div className="conflict-branch">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>
                      Evidence Record #B
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      {conf.values[1] || 'Unstated'}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unplaced Items Tray (PRD Section 8) */}
      {unplaced_items.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '36px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <HelpCircle size={18} color="var(--text-muted)" />
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Unplaced Evidence Tray ({unplaced_items.length})</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
            Artifacts missing extractable timestamps are preserved here rather than silently dropped or artificially ordered.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {unplaced_items.map((u, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                <span className="badge badge-evidence-type" style={{ marginRight: '8px' }}>{u.evidence_type}</span>
                {u.raw_text_summary}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
