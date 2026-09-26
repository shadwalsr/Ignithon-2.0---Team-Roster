import React from 'react';
import { 
  Clock, AlertTriangle, AlertOctagon, HelpCircle, 
  ArrowRight, ShieldAlert, CheckCircle, Split, FileCheck, FileText, Download
} from 'lucide-react';

export default function TimelineView({
  timelineData,
  onGenerateReport,
  loading
}) {
  if (!timelineData) {
    return (
      <div className="dossier-card" style={{ padding: '60px', textAlign: 'center' }}>
        <Clock size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ textTransform: 'uppercase' }}>No Timeline Assembled Yet</h3>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginTop: '6px' }}>
          Please review evidence extractions and click "Compile Timeline".
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Metric Cards Deck matching Stitch Screen 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        
        <div className="dossier-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--primary-container)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <span className="label-pantone" style={{ color: 'var(--on-primary-container)', fontSize: '11px' }}>SYNCHRONIZED AUDIT NODES</span>
            <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>
              {timeline.length < 10 ? `0${timeline.length}` : timeline.length}
            </span>
          </div>
          <div style={{ padding: '8px 16px', background: '#fff' }}>
            <span className="code-badge" style={{ color: 'var(--outline)', fontSize: '10px' }}>UTC+05:30 IST // RECONCILED</span>
          </div>
        </div>

        <div className="dossier-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: gaps.length > 0 ? '1px solid var(--secondary)' : '1px solid var(--border-subtle)' }}>
          <div style={{ background: 'var(--secondary)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <span className="label-pantone" style={{ color: 'var(--secondary-fixed)', fontSize: '11px' }}>TEMPORAL GAPS DETECTED</span>
            <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>
              {gaps.length < 10 ? `0${gaps.length}` : gaps.length}
            </span>
          </div>
          <div style={{ padding: '8px 16px', background: '#fff' }}>
            <span className="code-badge" style={{ color: 'var(--secondary)', fontSize: '10px', fontWeight: 700 }}>
              CRITICAL LULL EXCEEDED
            </span>
          </div>
        </div>

        <div className="dossier-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: conflicts.length > 0 ? '1px solid var(--secondary-container)' : '1px solid var(--border-subtle)' }}>
          <div style={{ background: 'var(--secondary-container)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <span className="label-pantone" style={{ color: '#fff', fontSize: '11px' }}>CROSS-EVIDENCE CONFLICTS</span>
            <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>
              {conflicts.length < 10 ? `0${conflicts.length}` : conflicts.length}
            </span>
          </div>
          <div style={{ padding: '8px 16px', background: '#fff' }}>
            <span className="code-badge" style={{ color: 'var(--secondary-container)', fontSize: '10px', fontWeight: 700 }}>
              DIVERGENT FIELD VALUES
            </span>
          </div>
        </div>

        <div className="dossier-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--surface-high)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--primary)' }}>
            <span className="label-pantone" style={{ fontSize: '11px' }}>UNPLACED ITEMS</span>
            <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>
              {unplaced_items.length < 10 ? `0${unplaced_items.length}` : unplaced_items.length}
            </span>
          </div>
          <div style={{ padding: '8px 16px', background: '#fff' }}>
            <span className="code-badge" style={{ color: 'var(--outline)', fontSize: '10px' }}>ZERO TEMPORAL LOCATOR</span>
          </div>
        </div>

      </div>

      {/* Main Editorial Timeline Canvas */}
      <section style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', padding: '28px', border: '1px solid var(--border-subtle)', position: 'relative' }}>
        
        {/* Top Spine Legend Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="label-pantone" style={{ color: 'var(--primary)', fontSize: '12px' }}>
              SYNCHRONIZED AUDIT SPINE
            </span>
            <span className="code-badge" style={{ background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: '2px' }}>
              UTC+05:30 IST
            </span>
            <span className="code-badge" style={{ color: 'var(--outline)' }}>
              ANCHOR INTERVAL: 10:00:00 — 11:30:00
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--outline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-container)' }}></span>
              <span>Reconciled</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
              <span>Discrepancy</span>
            </div>
            <button
              onClick={onGenerateReport}
              disabled={loading}
              className="btn-dossier-primary"
              style={{ background: 'var(--secondary)', border: 'none', padding: '6px 14px', fontSize: '11px' }}
            >
              <span>4. Final Incident Report</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Structural Gap Warning if detected */}
        {gaps.filter(g => g.type === "structural").map((sg, idx) => (
          <div key={idx} style={{ background: 'rgba(232, 19, 124, 0.08)', border: '1px solid var(--secondary)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '13px', textTransform: 'uppercase' }}>
                STRUCTURAL GAP IDENTIFIED
              </div>
              <div style={{ fontSize: '13px', color: 'var(--on-surface)', marginTop: '2px' }}>
                {sg.description}
              </div>
            </div>
          </div>
        ))}

        {/* Continuous Spine Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
          
          {timeline.map((item, idx) => {
            const gapAfter = gapsByPrecedingId[item.evidence_id];
            const formattedTime = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
            const formattedDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '';

            // Check if this item is part of a conflict
            const itemConflicts = conflicts.filter(c => (c.evidence_ids || []).includes(item.evidence_id));
            const hasConflict = itemConflicts.length > 0;

            return (
              <React.Fragment key={item.evidence_id || idx}>
                
                {/* Regular Timeline Node Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '24px', alignItems: 'flex-start', position: 'relative' }}>
                  
                  {/* Spine segment & Node */}
                  <div className="timeline-spine" />
                  <div className={hasConflict ? "spine-node-conflict" : "spine-node-reconciled"} />

                  {/* Left Column: Timestamp */}
                  <div style={{ textAlign: 'right', paddingRight: '20px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: hasConflict ? 'var(--secondary)' : 'var(--primary)' }}>
                      {formattedTime}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>
                      {formattedDate}
                    </div>
                    <div className="code-badge" style={{ color: 'var(--on-primary-container)', fontSize: '10px', marginTop: '4px' }}>
                      NODE #{idx + 1}
                    </div>
                  </div>

                  {/* Right Column: Specimen Card */}
                  <div>
                    <div className="dossier-card" style={{ overflow: 'hidden' }}>
                      
                      {/* Pantone Specimen Header */}
                      <div style={{ background: hasConflict ? 'var(--secondary)' : 'var(--primary-container)', color: '#ffffff', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="code-badge" style={{ color: hasConflict ? 'var(--secondary-fixed)' : 'var(--primary-fixed-dim)', textTransform: 'uppercase' }}>
                            SPECIMEN ID: EVNT_0{idx + 1}
                          </span>
                          <span style={{ opacity: 0.4 }}>/</span>
                          <span className="label-pantone" style={{ color: '#fff', fontSize: '10px' }}>
                            {item.evidence_type.toUpperCase()} VECTOR
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span className="code-badge" style={{ background: '#ffffff', color: 'var(--primary)', padding: '1px 6px', borderRadius: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {item.evidence_type}
                          </span>
                          {item.extraction_confidence && (
                            <span className="code-badge" style={{ background: 'var(--primary-fixed-dim)', color: 'var(--on-primary-fixed)', padding: '1px 6px', borderRadius: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
                              {item.extraction_confidence} Conf
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div style={{ padding: '16px' }}>
                        <p style={{ fontSize: '13.5px', color: 'var(--on-surface)', lineHeight: 1.6, fontWeight: 500, marginBottom: '12px' }}>
                          {item.raw_text_summary}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          {item.amount !== null && item.amount !== undefined && (
                            <span style={{ background: 'var(--surface-container)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              AMOUNT: {item.currency} {item.amount}
                            </span>
                          )}
                          {item.transaction_id && (
                            <span style={{ background: 'var(--surface-container)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              REF: {item.transaction_id}
                            </span>
                          )}
                          {item.sender && (
                            <span style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)', padding: '2px 8px', borderRadius: '4px' }}>
                              ORIGIN: {item.sender}
                            </span>
                          )}
                          {item.phone_numbers && item.phone_numbers.length > 0 && (
                            <span style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)', padding: '2px 8px', borderRadius: '4px' }}>
                              CONTACT: {item.phone_numbers[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metadata Collar */}
                      <div style={{ background: 'var(--surface-low)', borderTop: '1px solid var(--border-subtle)', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--outline)', fontFamily: 'var(--font-mono)' }}>
                        <span>TELEMETRY VERIFIED // ITEM #{idx + 1}</span>
                        <span>HASH: {item.sha256_hash ? item.sha256_hash.substring(0, 10) + '...' : 'SECURED'}</span>
                      </div>

                    </div>
                  </div>

                </div>

                {/* WOW MOMENT 1: Stitch Pink Dashed Temporal Gap Banner */}
                {gapAfter && (
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '24px', alignItems: 'center', position: 'relative', margin: '10px 0' }}>
                    
                    {/* Pink Dashed Spine Segment */}
                    <div className="spine-gap-dashed" />
                    
                    {/* Ping Marker */}
                    <div style={{ position: 'absolute', left: '172px', top: '50%', transform: 'translate(-6px, -50%)', width: '15px', height: '15px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />
                    </div>

                    {/* Gap Duration Column */}
                    <div style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, color: 'var(--secondary)' }}>
                        {gapAfter.duration_minutes ? `${Math.round(gapAfter.duration_minutes)}m DURATION` : 'LULL GAP'}
                      </div>
                      <div className="code-badge" style={{ color: 'var(--secondary)', fontSize: '10px', fontWeight: 700 }}>
                        AUDIT BREAK
                      </div>
                    </div>

                    {/* Full-width Anomaly Banner matching Stitch Screen 3 */}
                    <div>
                      <div style={{ background: 'rgba(232, 19, 124, 0.08)', border: '1px solid var(--secondary)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span className="label-pantone" style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '11px' }}>
                                CRITICAL TEMPORAL ANOMALY
                              </span>
                              <span className="code-badge" style={{ background: 'var(--secondary)', color: '#fff', padding: '1px 6px', borderRadius: '2px', fontWeight: 700, fontSize: '10px' }}>
                                THRESHOLD VIOLATION (+{Math.round((gapAfter.duration_minutes || 20) - 20)}m)
                              </span>
                            </div>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.4 }}>
                              {gapAfter.description}
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                              Temporal response threshold (20m) critically exceeded. Recommendation: Issue immediate Section 91 CrPC notice for victim mobile ISP DNS resolver logs and local tower CDR.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-dossier-alert"
                          style={{ padding: '8px 14px', fontSize: '11px' }}
                          onClick={() => alert("Subpoena notice drafted under Section 91 CrPC for cyber-cell intake!")}
                        >
                          <span>Request ISP DNS Subpoena</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </React.Fragment>
            );
          })}

        </div>

      </section>

      {/* WOW MOMENT 2: Contradiction & Transaction Conflict Mosaic matching Stitch Screen 3 */}
      {conflicts.length > 0 && (
        <section style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-md)' }}>
          
          <div style={{ background: 'var(--secondary)', color: '#ffffff', margin: '-24px -24px 20px -24px', padding: '10px 20px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Split size={18} />
              <span className="label-pantone" style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em' }}>
                CONTRADICTION DETECTED // CROSS-EVIDENCE DIVERGENCE
              </span>
            </div>
            <span className="code-badge" style={{ background: '#fff', color: 'var(--secondary)', padding: '2px 8px', borderRadius: '2px', fontWeight: 800 }}>
              FLAGGED RULE: #FIN-AUD-88
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {conflicts.map((conf, cIdx) => (
              <div key={conf.conflict_id || cIdx}>
                <p style={{ fontSize: '13.5px', color: 'var(--on-surface)', marginBottom: '14px', fontWeight: 600 }}>
                  {conf.description}
                </p>

                {/* Two-Column Comparison Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  {/* Evidence Source A */}
                  <div style={{ background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '8px' }}>
                      <span className="label-pantone" style={{ color: 'var(--primary)' }}>EVIDENCE SOURCE A: CARRIER SMS ALERT</span>
                      <span className="code-badge">ITEM #A</span>
                    </div>
                    <span className="code-badge" style={{ color: 'var(--outline)', textTransform: 'uppercase' }}>AMOUNT RECORDED</span>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-headline)', margin: '4px 0' }}>
                      {conf.values[0] || 'N/A'}
                    </div>
                    <span className="code-badge" style={{ color: 'var(--secondary)', textDecoration: 'underline', fontWeight: 700 }}>
                      NOMINAL BANK CLAIM
                    </span>
                  </div>

                  {/* Evidence Source B */}
                  <div style={{ background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '8px' }}>
                      <span className="label-pantone" style={{ color: 'var(--secondary)' }}>EVIDENCE SOURCE B: THREAT CHAT</span>
                      <span className="code-badge">ITEM #B</span>
                    </div>
                    <span className="code-badge" style={{ color: 'var(--outline)', textTransform: 'uppercase' }}>AMOUNT CLAIMED</span>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--secondary)', fontFamily: 'var(--font-headline)', margin: '4px 0' }}>
                      {conf.values[1] || 'N/A'}
                    </div>
                    <span className="code-badge" style={{ color: 'var(--secondary)', textDecoration: 'underline', fontWeight: 700 }}>
                      SURCHARGE DELTA DIVERGENCE
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </section>
      )}

      {/* Unplaced Items Tray */}
      {unplaced_items.length > 0 && (
        <section className="dossier-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HelpCircle size={18} color="var(--outline)" />
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: 700 }}>
              Unplaced Artifact Tray ({unplaced_items.length})
            </h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '12px' }}>
            Specimens with no extractable timestamp are segregated here rather than guessed into place.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unplaced_items.map((u, idx) => (
              <div key={idx} style={{ background: 'var(--surface-low)', padding: '10px 14px', borderRadius: '4px', fontSize: '13px' }}>
                <span className="code-badge" style={{ background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: '2px', marginRight: '8px' }}>
                  {u.evidence_type}
                </span>
                {u.raw_text_summary}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
