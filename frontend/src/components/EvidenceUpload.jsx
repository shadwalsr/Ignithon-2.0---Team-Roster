import React, { useState } from 'react';
import { Upload, Image as ImageIcon, ArrowRight, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function EvidenceUpload({
  caseId,
  evidenceList,
  onEvidenceAdded,
  onBuildTimeline,
  onNextToReview,
  loading
}) {
  const [evidenceType, setEvidenceType] = useState('sms');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState('files');

  async function handleUpload(e) {
    e.preventDefault();
    if (!rawText.trim() && !selectedFile) {
      alert("Please enter text or select a file.");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("evidence_type", evidenceType);
      if (rawText.trim()) formData.append("raw_text", rawText.trim());
      if (selectedFile) formData.append("file", selectedFile);
      const result = await api.uploadEvidence(caseId, formData);
      onEvidenceAdded(result);
      setRawText('');
      setSelectedFile(null);
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ maxWidth: 640 }}>
          <p className="label" style={{ marginBottom: 6, color: 'var(--green-600)' }}>Step 1 — Evidence Ingestion</p>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Upload Evidence</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Upload screenshots, chat transcripts, UPI alerts, or paste raw communication logs. 
            Structured entities are extracted automatically without persisting unredacted PII.
          </p>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="stat-card" style={{ minWidth: 100 }}>
            <span className="stat-label">Items</span>
            <span className="stat-value" style={{ color: 'var(--green-800)' }}>
              {String(evidenceList.length).padStart(2, '0')}
            </span>
            <span className="stat-sub">uploaded</span>
          </div>
          <div className="stat-card" style={{ minWidth: 100 }}>
            <span className="stat-label">Fields</span>
            <span className="stat-value" style={{ color: 'var(--green-800)' }}>
              {String(evidenceList.length * 5).padStart(2, '0')}
            </span>
            <span className="stat-sub">extracted</span>
          </div>
          <div className="stat-card" style={{ minWidth: 100, borderColor: evidenceList.length > 0 ? 'var(--green-100)' : 'var(--border)' }}>
            <span className="stat-label">Status</span>
            <span className="stat-value" style={{ fontSize: 16, color: evidenceList.length > 0 ? 'var(--green-600)' : 'var(--text-muted)' }}>
              {evidenceList.length > 0 ? 'Ready' : 'Waiting'}
            </span>
            <span className="stat-sub">for timeline</span>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="stepper-nav" style={{ flex: '0 1 auto' }}>
          <button
            onClick={() => setMode('files')}
            className={`step-tab ${mode === 'files' ? 'active' : ''}`}
          >
            <Upload size={13} style={{ marginRight: 4 }} />
            Upload Files
          </button>
          <button
            onClick={() => setMode('paste')}
            className={`step-tab ${mode === 'paste' ? 'active' : ''}`}
          >
            Paste Text
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="label" style={{ marginRight: 4 }}>Type:</span>
          <select
            className="input input-mono"
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            style={{ width: 'auto', fontSize: 12 }}
          >
            <option value="sms">Bank / SMS Alert</option>
            <option value="chat">WhatsApp / Threat Chat</option>
            <option value="transaction">UPI / NetBanking Record</option>
            <option value="email">Phishing Email</option>
            <option value="app_notification">Push Notification</option>
            <option value="log">Access / DNS Log</option>
            <option value="other">Other Evidence</option>
          </select>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {mode === 'files' ? (
          <div className="dropzone">
            <input
              accept="image/*,.pdf,.txt"
              id="evidence-file-input"
              style={{ display: 'none' }}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <label htmlFor="evidence-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 52, height: 52, borderRadius: '50%', 
                background: 'var(--green-50)', border: '2px solid var(--green-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                marginBottom: 14 
              }}>
                <ImageIcon size={24} color="var(--green-600)" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                Drop fraud screenshots, UPI receipts, or SMS clips
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420 }}>
                PNG, JPG, PDF up to 25MB · Automated entity extraction on ingest
              </p>
              {selectedFile && (
                <div className="badge badge-green" style={{ marginTop: 14, fontSize: 12, padding: '5px 12px' }}>
                  <CheckCircle2 size={14} />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </label>
          </div>
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <label className="label" style={{ display: 'block', marginBottom: 8 }}>
              Raw Text / Communication Logs
            </label>
            <textarea
              className="input input-mono"
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste SMS text, WhatsApp transcript, phishing URL, or bank debit statement…"
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={isUploading} className="btn btn-primary">
            {isUploading ? (
              <span>Extracting…</span>
            ) : (
              <>
                <Plus size={15} />
                <span>Ingest & Extract</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Ingested Evidence List */}
      {evidenceList.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                Uploaded Evidence ({evidenceList.length})
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Each item is hashed with SHA-256 for chain-of-custody integrity.
              </p>
            </div>
            <button onClick={onNextToReview} className="btn btn-primary btn-sm">
              Review Extractions <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {evidenceList.map((item, idx) => {
              const ext = item.extraction || {};
              return (
                <div key={item.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ 
                    padding: '8px 14px', 
                    background: 'var(--green-50)',
                    borderBottom: '1px solid var(--green-100)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge badge-green" style={{ padding: '2px 6px' }}>#{idx + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-800)', textTransform: 'uppercase' }}>{item.evidence_type}</span>
                    </div>
                    {ext.extraction_confidence && (
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                        {ext.extraction_confidence}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 14, flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 10 }}>
                      {ext.raw_text_summary || item.raw_text || "Visual screenshot artifact recorded."}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-faint)' }}>
                      <span className="mono">
                        {ext.timestamp ? new Date(ext.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC' : '—'}
                      </span>
                      <span className="mono">
                        SHA: {item.sha256_hash ? item.sha256_hash.substring(0, 8) + '…' : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
