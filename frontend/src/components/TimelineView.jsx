import React from 'react';
import { Clock, AlertTriangle, ArrowRight, HelpCircle, Split } from 'lucide-react';

export default function TimelineView({
  timelineData,
  onGenerateReport,
  loading
}) {
  if (!timelineData) {
    return (
      <div className="card fade-in" style={{ padding: 60, textAlign: 'center' }}>
        <Clock size={36} color="var(--green-600)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 18 }}>No Timeline Yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Review evidence extractions, then click "Build Timeline".
        </p>
      </div>
    );
  }

  const { timeline = [], unplaced_items = [], gaps = [], conflicts = [] } = timelineData;

  const gapsByPrecedingId = {};
  gaps.forEach((g) => {
    if (g.type === "temporal" && g.between?.[0]) {
      gapsByPrecedingId[g.between[0]] = g;
    }
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header with stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <p className="label" style={{ marginBottom: 6, color: 'var(--green-600)' }}>Step 3 — Reconciliation</p>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>Timeline & Gap Analysis</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="stat-card" style={{ minWidth: 90 }}>
            <span className="stat-label">Events</span>
            <span className="stat-value" style={{ color: 'var(--green-800)' }}>{String(timeline.length).padStart(2, '0')}</span>
          </div>
          <div className="stat-card" style={{ minWidth: 90, borderColor: gaps.length > 0 ? 'var(--pink-100)' : 'var(--border)' }}>
            <span className="stat-label">Gaps</span>
            <span className="stat-value" style={{ color: gaps.length > 0 ? 'var(--pink-600)' : 'var(--text-muted)' }}>
              {String(gaps.length).padStart(2, '0')}
            </span>
          </div>
          <div className="stat-card" style={{ minWidth: 90, borderColor: conflicts.length > 0 ? 'var(--pink-100)' : 'var(--border)' }}>
            <span className="stat-label">Conflicts</span>
            <span className="stat-value" style={{ color: conflicts.length > 0 ? 'var(--pink-600)' : 'var(--text-muted)' }}>
              {String(conflicts.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Structural gap warnings */}
      {gaps.filter(g => g.type === "structural").map((sg, idx) => (
        <div key={idx} style={{
          background: 'var(--pink-50)', border: '1px solid var(--pink-100)', borderRadius: 'var(--radius-md)',
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12
        }}>
          <AlertTriangle size={18} color="var(--pink-600)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--pink-700)', fontSize: 13 }}>Structural Gap</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{sg.description}</div>
          </div>
        </div>
      ))}

      {/* Timeline spine */}
      <div className="card" style={{ padding: '28px 24px 28px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Audit Spine</span>
            <span className="badge badge-green">IST (UTC+05:30)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-600)' }} />
                Reconciled
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--pink-500)', transform: 'rotate(45deg)' }} />
                Conflict
              </div>
            </div>
          </div>
          <button onClick={onGenerateReport} disabled={loading} className="btn btn-primary btn-sm">
            Generate Report <ArrowRight size={14} />
          </button>
        </div>

        <div className="timeline-container">
          {timeline.map((item, idx) => {
            const gapAfter = gapsByPrecedingId[item.evidence_id];
            const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
            const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short' }) : '';
            const itemConflicts = conflicts.filter(c => (c.evidence_ids || []).includes(item.evidence_id));
            const hasConflict = itemConflicts.length > 0;

            return (
              <React.Fragment key={item.evidence_id || idx}>
                <div className={`timeline-node ${hasConflict ? 'conflict' : ''}`}>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{
                      padding: '8px 14px',
                      background: hasConflict ? 'var(--pink-50)' : 'var(--green-50)',
                      borderBottom: `1px solid ${hasConflict ? 'var(--pink-100)' : 'var(--green-100)'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mono" style={{ fontWeight: 700, color: hasConflict ? 'var(--pink-600)' : 'var(--green-700)', fontSize: 13 }}>
                          {time}
                        </span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{date}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span className={`badge ${hasConflict ? 'badge-pink' : 'badge-green'}`} style={{ fontSize: 10 }}>
                          {item.evidence_type}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginBottom: 8 }}>
                        {item.raw_text_summary}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {item.amount != null && (
                          <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                            {item.currency} {item.amount}
                          </span>
                        )}
                        {item.transaction_id && (
                          <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                            Ref: {item.transaction_id}
                          </span>
                        )}
                        {item.sender && (
                          <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                            From: {item.sender}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Temporal Gap Banner */}
                {gapAfter && (
                  <div className="timeline-gap">
                    <div style={{
                      background: 'var(--pink-50)',
                      border: '1px solid var(--pink-100)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      display: 'flex', alignItems: 'flex-start', gap: 12
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--pink-500)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <AlertTriangle size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: 'var(--pink-700)', fontSize: 13 }}>
                            Temporal Gap: {Math.round(gapAfter.duration_minutes || 0)} minutes
                          </span>
                          <span className="badge badge-pink" style={{ fontSize: 10 }}>
                            Threshold exceeded
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {gapAfter.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Conflicts Section */}
      {conflicts.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '12px 20px',
            background: 'var(--pink-50)',
            borderBottom: '1px solid var(--pink-100)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Split size={16} color="var(--pink-600)" />
              <span style={{ fontWeight: 700, color: 'var(--pink-700)', fontSize: 14 }}>Contradictions Detected</span>
            </div>
            <span className="badge badge-pink">{conflicts.length} conflicts</span>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {conflicts.map((conf, cIdx) => (
              <div key={conf.conflict_id || cIdx}>
                <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 12, fontWeight: 600 }}>
                  {conf.description}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="card-flat" style={{ padding: 14 }}>
                    <span className="label" style={{ color: 'var(--green-700)', marginBottom: 6, display: 'block' }}>Source A</span>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green-800)' }}>
                      {conf.values?.[0] || 'N/A'}
                    </div>
                  </div>
                  <div className="card-flat" style={{ padding: 14, borderColor: 'var(--pink-100)' }}>
                    <span className="label" style={{ color: 'var(--pink-700)', marginBottom: 6, display: 'block' }}>Source B</span>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--pink-600)' }}>
                      {conf.values?.[1] || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unplaced Items */}
      {unplaced_items.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <HelpCircle size={16} color="var(--text-muted)" />
            <h4 style={{ fontSize: 14, fontWeight: 700 }}>Unplaced Items ({unplaced_items.length})</h4>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Items without extractable timestamps.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unplaced_items.map((u, idx) => (
              <div key={idx} className="card-flat" style={{ padding: '10px 14px', fontSize: 13 }}>
                <span className="badge badge-neutral" style={{ marginRight: 8 }}>{u.evidence_type}</span>
                {u.raw_text_summary}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
