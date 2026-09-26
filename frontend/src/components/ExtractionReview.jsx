import React, { useState } from 'react';
import { Save, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
    amount: ext.amount != null ? ext.amount : '',
    currency: ext.currency || 'INR',
    transaction_id: ext.transaction_id || '',
    sender: ext.sender || '',
    raw_text_summary: ext.raw_text_summary || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (currentItem) {
      const e = currentItem.extraction || {};
      setEditForm({
        timestamp: e.timestamp || '',
        amount: e.amount != null ? e.amount : '',
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
      <div className="card fade-in" style={{ padding: 60, textAlign: 'center' }}>
        <h3 style={{ fontSize: 18 }}>No Evidence to Review</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Ingest evidence items in Step 1 first.
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
      alert("Save failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="label" style={{ marginBottom: 6, color: 'var(--green-600)' }}>Step 2 — Extraction Review</p>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Item {selectedIndex + 1} of {evidenceList.length}: <span style={{ textTransform: 'capitalize' }}>{currentItem.evidence_type}</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Verify, correct, or refine automated entity extractions before timeline compilation.
          </p>
        </div>

        {/* Item selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {evidenceList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`btn btn-sm ${selectedIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minWidth: 44, justifyContent: 'center', fontSize: 11 }}
            >
              #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left: Original Source */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'var(--green-50)', borderBottom: '1px solid var(--green-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label" style={{ color: 'var(--green-700)' }}>Original Source</span>
            <span className="badge badge-neutral" style={{ fontSize: 10 }}>Specimen {selectedIndex + 1}</span>
          </div>
          <div style={{ padding: 20 }}>
            <div className="card-flat" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={14} color="var(--green-600)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-700)', textTransform: 'uppercase' }}>
                  {currentItem.evidence_type} Record
                </span>
              </div>
              <p className="mono" style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>
                {currentItem.raw_text || ext.raw_text_summary || "Visual screenshot artifact."}
              </p>
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-faint)' }} className="mono">
              <span>SHA-256: {currentItem.sha256_hash ? currentItem.sha256_hash.substring(0, 14) + '…' : '—'}</span>
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Right: Entity Editor */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span className="label" style={{ color: 'var(--green-700)' }}>Parsed Entities</span>
            {ext.extraction_confidence && (
              <span className="badge badge-green">{ext.extraction_confidence} confidence</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Timestamp (ISO 8601)</label>
              <input
                type="text"
                className="input input-mono"
                value={editForm.timestamp}
                onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
                placeholder="2026-09-26T10:45:00Z"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Amount</label>
                <input
                  type="number"
                  className="input input-mono"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  placeholder="5000.00"
                />
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>Currency</label>
                <input
                  type="text"
                  className="input input-mono"
                  value={editForm.currency}
                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Transaction ID / UTR</label>
              <input
                type="text"
                className="input input-mono"
                value={editForm.transaction_id}
                onChange={(e) => setEditForm({ ...editForm, transaction_id: e.target.value })}
                placeholder="UPI429810482910"
              />
            </div>

            <div>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Sender / Contact</label>
              <input
                type="text"
                className="input input-mono"
                value={editForm.sender}
                onChange={(e) => setEditForm({ ...editForm, sender: e.target.value })}
                placeholder="+91-9823411223"
              />
            </div>

            <div>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Summary</label>
              <textarea
                className="input"
                rows={3}
                value={editForm.raw_text_summary}
                onChange={(e) => setEditForm({ ...editForm, raw_text_summary: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <button onClick={handleSave} disabled={isSaving} className="btn btn-secondary btn-sm">
              <Save size={14} />
              {isSaving ? "Saving…" : saveSuccess ? "Saved ✓" : "Save Changes"}
            </button>
            <button onClick={onProceedToTimeline} className="btn btn-primary btn-sm">
              Build Timeline <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
