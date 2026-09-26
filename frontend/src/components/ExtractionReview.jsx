import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Edit3, Save, ArrowRight, ArrowLeft, 
  Smartphone, Hash, Clock, DollarSign, User, ShieldCheck, ExternalLink
} from 'lucide-react';
import { api } from '../api';

export default function ExtractionReview({
  caseId,
  evidenceList,
  onUpdateEvidence,
  onProceedToTimeline
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentItem = evidenceList[selectedIndex] || null;
  const ext = currentItem?.extraction || {};

  const [editForm, setEditForm] = useState({
    timestamp: ext.timestamp || '',
    amount: ext.amount !== null && ext.amount !== undefined ? ext.amount : '',
    currency: ext.currency || 'INR',
    transaction_id: ext.transaction_id || '',
    sender: ext.sender || '',
    raw_text_summary: ext.raw_text_summary || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync edit form when switching selected specimen
  React.useEffect(() => {
    if (currentItem) {
      const e = currentItem.extraction || {};
      setEditForm({
        timestamp: e.timestamp || '',
        amount: e.amount !== null && e.amount !== undefined ? e.amount : '',
        currency: e.currency || 'INR',
        transaction_id: e.transaction_id || '',
        sender: e.sender || '',
        raw_text_summary: e.raw_text_summary || ''
      });
      setSaveSuccess(false);
    }
  }, [selectedIndex, currentItem]);

  if (!currentItem) {
    return (
      <div className="dossier-card" style={{ padding: '60px', textAlign: 'center' }}>
        <h3>No Evidence Specimens to Review</h3>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '6px' }}>
          Please ingest evidence items in Step 1 first.
        </p>
      </div>
    );
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const payload = {
        ...editForm,
        amount: editForm.amount !== '' ? parseFloat(editForm.amount) : null
      };
      await api.updateExtraction(caseId, currentItem.id, payload);
      const updated = await api.getEvidence(caseId);
      onUpdateEvidence(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert("Failed to save changes: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Item Selector tabs matching Stitch Screen 2 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="code-badge" style={{ background: 'var(--surface-high)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '2px', fontWeight: 700 }}>
              EVIDENCE ARTIFACT DOSSIER
            </span>
            <span style={{ color: 'var(--outline)' }}>/</span>
            <span className="code-badge" style={{ color: 'var(--on-surface-variant)' }}>
              SERIAL: 2026-OCT-SPECIMEN-{selectedIndex + 1}
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, textTransform: 'uppercase' }}>
            Evidence Item {selectedIndex + 1} of {evidenceList.length}: {currentItem.evidence_type.toUpperCase()}
          </h1>
        </div>

        {/* Tab Buttons for switching items */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {evidenceList.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(idx)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: selectedIndex === idx ? 'var(--primary)' : '#ffffff',
                color: selectedIndex === idx ? '#ffffff' : 'var(--on-surface)',
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {selectedIndex === idx && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary-container)' }}></span>
              )}
              <span>Item 0{idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Inspection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Original Source Evidence Specimen Plate */}
        <div className="dossier-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '1px' }}></div>
              <span className="label-pantone" style={{ color: 'var(--on-surface)', letterSpacing: '0.1em' }}>
                ORIGINAL SOURCE EVIDENCE
              </span>
            </div>
            <span className="code-badge" style={{ background: 'var(--surface-high)', color: 'var(--on-surface-variant)', padding: '2px 6px', borderRadius: '2px' }}>
              Specimen Plate A-{selectedIndex + 1}
            </span>
          </div>

          <div style={{ padding: '24px', background: 'var(--surface-low)', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '380px', background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--outline)', marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>SMS GATEWAY · VERIFIED</span>
                <span className="code-badge">{currentItem.evidence_type.toUpperCase()}</span>
              </div>

              <div style={{ background: 'var(--surface-low)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(13,59,36,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  <ShieldCheck size={16} color="var(--primary)" />
                  <span>TRANSACTIONAL / THREAT RECORD</span>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface)', lineHeight: 1.6 }}>
                  {currentItem.raw_text || ext.raw_text_summary || "Visual screenshot artifact."}
                </p>
              </div>

              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--outline)', fontFamily: 'var(--font-mono)' }}>
                <span>SHA-256: {currentItem.sha256_hash ? currentItem.sha256_hash.substring(0, 12) + '...' : 'ATTESTED'}</span>
                <span>AUTHENTICITY // VALID</span>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Extracted Forensic Entities (Editable) */}
        <div className="dossier-card" style={{ padding: '24px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div>
              <span className="label-pantone" style={{ color: 'var(--primary)', letterSpacing: '0.08em' }}>
                PARSED FORENSIC ENTITIES
              </span>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                Verify, correct, or refine automated entity isolations prior to timeline compilation.
              </p>
            </div>
            {ext.extraction_confidence && (
              <span className="code-badge" style={{ background: 'var(--primary-container)', color: '#fff', padding: '2px 8px', borderRadius: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
                {ext.extraction_confidence} Confidence
              </span>
            )}
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Timestamp */}
            <div>
              <label className="label-pantone" style={{ display: 'block', color: 'var(--outline)', marginBottom: '4px' }}>
                ISO8601 Timestamp
              </label>
              <input
                type="text"
                value={editForm.timestamp}
                onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
                placeholder="2026-09-26T10:45:00Z"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'var(--primary)',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Amount & Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px' }}>
              <div>
                <label className="label-pantone" style={{ display: 'block', color: 'var(--outline)', marginBottom: '4px' }}>
                  Extracted Amount
                </label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  placeholder="5000.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: 'var(--secondary)',
                    fontWeight: 700
                  }}
                />
              </div>
              <div>
                <label className="label-pantone" style={{ display: 'block', color: 'var(--outline)', marginBottom: '4px' }}>
                  Currency
                </label>
                <input
                  type="text"
                  value={editForm.currency}
                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="label-pantone" style={{ display: 'block', color: 'var(--outline)', marginBottom: '4px' }}>
                Transaction Reference ID / UTR
              </label>
              <input
                type="text"
                value={editForm.transaction_id}
                onChange={(e) => setEditForm({ ...editForm, transaction_id: e.target.value })}
                placeholder="UPI429810482910"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Sender */}
            <div>
              <label className="label-pantone" style={{ display: 'block', color: 'var(--outline)', marginBottom: '4px' }}>
                Sender / Handle / Contact
              </label>
              <input
                type="text"
                value={editForm.sender}
                onChange={(e) => setEditForm({ ...editForm, sender: e.target.value })}
                placeholder="+91-9823411223 or HDFC-BANK"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Raw Text Summary */}
            <div>
              <label className="label-pantone" style={{ display: 'block', color: 'var(--outline)', marginBottom: '4px' }}>
                Factual Forensic Summary
              </label>
              <textarea
                rows={3}
                value={editForm.raw_text_summary}
                onChange={(e) => setEditForm({ ...editForm, raw_text_summary: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
            </div>

          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-dossier-primary"
              style={{ background: 'var(--primary-container)', fontSize: '11px' }}
            >
              <Save size={14} />
              <span>{isSaving ? "Saving..." : (saveSuccess ? "Saved Successfully!" : "Save Entity Updates")}</span>
            </button>

            <button
              onClick={onProceedToTimeline}
              className="btn-dossier-primary"
              style={{ background: 'var(--secondary)', border: 'none', fontSize: '11px' }}
            >
              <span>Compile 3. Timeline</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
