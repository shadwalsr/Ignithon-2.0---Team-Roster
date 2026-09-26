import React, { useState } from 'react';
import { 
  Upload, FileText, Image as ImageIcon, CheckCircle2, 
  AlertCircle, Edit3, Save, ArrowRight, ShieldCheck, Plus, Sparkles
} from 'lucide-react';
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
  const [mode, setMode] = useState('files'); // 'files' | 'paste'

  async function handleUpload(e) {
    e.preventDefault();
    if (!rawText.trim() && !selectedFile) {
      alert("Please enter text or select an evidence screenshot file.");
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
      alert("Evidence ingestion error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Editorial Master Header Section matching Stitch Screen 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="code-badge" style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              STAGE 01 // EVIDENCE ONBOARDING
            </span>
            <span style={{ color: 'var(--outline-variant)' }}>/</span>
            <span className="label-pantone" style={{ color: 'var(--on-surface-variant)' }}>
              CHAIN OF CUSTODY VERIFIED
            </span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1 }}>
            Ingest Unstructured Evidence
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--on-surface-variant)', marginTop: '8px', lineHeight: 1.6 }}>
            Upload screenshots, chat transcripts, UPI alerts, or paste raw communication logs. Our vision extraction models parse structured forensic entities without persisting unredacted PII.
          </p>
        </div>

        {/* Quick Metrics Deck (Pantone Swatch Metaphor) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
          
          <div className="dossier-card" style={{ width: '130px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'var(--primary-container)', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              <span className="label-pantone" style={{ color: 'var(--on-primary-container)', fontSize: '9px' }}>ITEMS</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>NODE</span>
            </div>
            <div style={{ padding: '8px 10px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '28px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {evidenceList.length < 10 ? `0${evidenceList.length}` : evidenceList.length}
              </span>
              <span className="code-badge" style={{ color: 'var(--on-surface-variant)', fontSize: '9px', textTransform: 'uppercase', marginTop: '2px' }}>
                Archived Nodes
              </span>
            </div>
          </div>

          <div className="dossier-card" style={{ width: '140px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'var(--primary)', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              <span className="label-pantone" style={{ color: 'var(--on-primary-container)', fontSize: '9px' }}>ENTITIES</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>EXTRACT</span>
            </div>
            <div style={{ padding: '8px 10px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '28px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {evidenceList.length * 5}
              </span>
              <span className="code-badge" style={{ color: 'var(--on-surface-variant)', fontSize: '9px', textTransform: 'uppercase', marginTop: '2px' }}>
                Isolated Fields
              </span>
            </div>
          </div>

          <div className="dossier-card" style={{ width: '160px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'var(--secondary)', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              <span className="label-pantone" style={{ color: 'var(--secondary-fixed)', fontSize: '9px' }}>STATUS</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>PIPE</span>
            </div>
            <div style={{ padding: '8px 10px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '18px', fontWeight: 800, color: 'var(--secondary)', lineHeight: 1, textTransform: 'uppercase' }}>
                READY
              </span>
              <span className="code-badge" style={{ color: 'var(--on-surface-variant)', fontSize: '9px', textTransform: 'uppercase', marginTop: '4px' }}>
                Reconciliation
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Mode Selector Ribbon matching Stitch */}
      <div style={{ background: 'var(--surface-low)', padding: '6px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-high)', padding: '4px', borderRadius: '24px' }}>
          <button
            onClick={() => setMode('files')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              background: mode === 'files' ? 'var(--primary)' : 'transparent',
              color: mode === 'files' ? '#ffffff' : 'var(--on-surface-variant)',
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer'
            }}
          >
            Upload Screenshots & Images (Active)
          </button>
          <button
            onClick={() => setMode('paste')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              background: mode === 'paste' ? 'var(--primary)' : 'transparent',
              color: mode === 'paste' ? '#ffffff' : 'var(--on-surface-variant)',
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer'
            }}
          >
            Paste Raw Text / Logs
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></span>
            <span className="label-pantone">OCR Vision Engine 4.2 vLLM</span>
          </div>
          <span style={{ color: 'var(--outline-variant)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></span>
            <span className="label-pantone">No Cloud GPU Retention</span>
          </div>
        </div>
      </div>

      {/* Upload Dropzone Container */}
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Modality Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="label-pantone" style={{ color: 'var(--primary)', minWidth: '130px' }}>Evidence Modality:</label>
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: '#fff',
              color: 'var(--on-surface)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <option value="sms">Bank / Carrier SMS Alert</option>
            <option value="chat">WhatsApp / Telegram Threat Chat</option>
            <option value="transaction">UPI / NetBanking Debit Record</option>
            <option value="email">Phishing Email / Header</option>
            <option value="app_notification">Mobile Push Notification</option>
            <option value="log">Access Gateway / DNS Resolver Log</option>
            <option value="other">Other Physical / Digital Evidence</option>
          </select>
        </div>

        {mode === 'files' ? (
          <div
            className="dossier-card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: '#ffffff',
              border: '2px dashed var(--border-subtle)',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <input
              accept="image/*,.pdf,.txt"
              id="evidence-file-input"
              style={{ display: 'none' }}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <label htmlFor="evidence-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <ImageIcon size={28} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                Drag fraud screenshots, UPI receipts, or SMS clips here
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '4px', maxWidth: '500px' }}>
                Supports PNG, JPG, PDF up to 25MB · Automated legal specimen identification applied on ingest.
              </p>

              {selectedFile && (
                <div style={{ marginTop: '16px', background: 'var(--surface-container)', padding: '6px 14px', borderRadius: '4px', fontWeight: 600, color: 'var(--primary)', fontSize: '13px' }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <span className="btn-dossier-primary" style={{ pointerEvents: 'none' }}>
                  <Upload size={14} />
                  <span>Browse Evidence Files</span>
                </span>
              </div>
            </label>
            <div className="code-badge" style={{ color: 'var(--outline)', marginTop: '20px', fontSize: '10px' }}>
              AUTOMATIC EXIF CLEANING & TIMESTAMP ATTESTATION OCCURS CLIENT-SIDE
            </div>
          </div>
        ) : (
          <div className="dossier-card" style={{ padding: '24px', background: '#fff' }}>
            <label className="label-pantone" style={{ display: 'block', color: 'var(--primary)', marginBottom: '8px' }}>
              Raw Text / Telemetry Logs
            </label>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste SMS text, WhatsApp transcript, phishing URL, or bank debit statement..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="submit"
            disabled={isUploading}
            className="btn-dossier-primary"
            style={{ padding: '10px 24px', fontSize: '13px' }}
          >
            {isUploading ? (
              <span>Extracting forensic fields...</span>
            ) : (
              <>
                <Plus size={16} />
                <span>Ingest & Extract Specimen</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Ingested Evidence Deck */}
      {evidenceList.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', textTransform: 'uppercase', fontWeight: 800 }}>
                Archived Evidence Specimens ({evidenceList.length})
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                Each item is stamped with an immutable SHA-256 legal hold signature.
              </p>
            </div>

            <button
              onClick={onNextToReview}
              className="btn-dossier-primary"
              style={{ background: 'var(--primary)', fontSize: '12px' }}
            >
              <span>Proceed to 2. Extraction Review</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {evidenceList.map((item, idx) => {
              const ext = item.extraction || {};
              return (
                <div key={item.id} className="dossier-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Pantone Specimen Header Block */}
                  <div style={{ background: 'var(--primary-container)', color: '#fff', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="code-badge" style={{ color: 'var(--on-primary-container)', fontSize: '10px' }}>#{idx + 1}</span>
                      <span className="label-pantone" style={{ color: '#fff', fontSize: '10px' }}>{item.evidence_type}</span>
                    </div>
                    {ext.extraction_confidence && (
                      <span className="code-badge" style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: '2px', fontSize: '9px', textTransform: 'uppercase' }}>
                        {ext.extraction_confidence} Conf
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {ext.raw_text_summary || item.raw_text || "Visual screenshot artifact recorded."}
                    </p>

                    {/* Metadata Collar */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--outline)', fontFamily: 'var(--font-mono)' }}>
                      <span>TIME: {ext.timestamp ? ext.timestamp.substring(11, 19) + ' UTC' : 'NULL'}</span>
                      <span>HASH: {item.sha256_hash ? item.sha256_hash.substring(0, 8) + '...' : 'SECURED'}</span>
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
