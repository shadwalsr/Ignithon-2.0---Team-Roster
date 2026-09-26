import React, { useState } from 'react';
import { 
  Upload, FileText, Image as ImageIcon, CheckCircle2, 
  AlertCircle, Edit3, Save, Hash, ArrowRight, ShieldCheck, Clock, Plus
} from 'lucide-react';
import { api } from '../api';

export default function EvidenceUpload({
  caseId,
  evidenceList,
  onEvidenceAdded,
  onBuildTimeline,
  loading
}) {
  const [evidenceType, setEvidenceType] = useState('sms');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  function startEditing(item) {
    setEditingId(item.id);
    const ext = item.extraction || {};
    setEditForm({
      timestamp: ext.timestamp || '',
      timestamp_confidence: ext.timestamp_confidence || 'medium',
      amount: ext.amount !== null && ext.amount !== undefined ? ext.amount : '',
      currency: ext.currency || 'INR',
      transaction_id: ext.transaction_id || '',
      sender: ext.sender || '',
      raw_text_summary: ext.raw_text_summary || ''
    });
  }

  async function saveEdit(evidenceId) {
    try {
      const payload = {
        ...editForm,
        amount: editForm.amount !== '' ? parseFloat(editForm.amount) : null
      };
      await api.updateExtraction(caseId, evidenceId, payload);
      setEditingId(null);
      // Reload evidence list
      const updated = await api.getEvidence(caseId);
      onEvidenceAdded(null, updated);
    } catch (err) {
      alert("Failed to update extraction: " + err.message);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Evidence Ingestion Form */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={18} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Ingest Evidence</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Screenshots, Chat Transcripts, SMS, Bank Logs</p>
          </div>
        </div>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Evidence Modality</label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: '0.88rem'
              }}
            >
              <option value="sms">Bank / Phishing SMS</option>
              <option value="chat">WhatsApp / Telegram Chat</option>
              <option value="transaction">UPI / Bank Transaction Record</option>
              <option value="email">Phishing Email</option>
              <option value="app_notification">App Push Notification</option>
              <option value="log">Access / Audit Log</option>
              <option value="other">Other Digital Artifact</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Upload Screenshot / Image (Optional)
            </label>
            <div style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              background: selectedFile ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                accept="image/*,.pdf,.txt"
                id="file-input"
                style={{ display: 'none' }}
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                <ImageIcon size={28} color={selectedFile ? 'var(--primary)' : 'var(--text-dim)'} style={{ margin: '0 auto 8px' }} />
                {selectedFile ? (
                  <div style={{ fontSize: '0.85rem', color: '#c7d2fe', fontWeight: 600 }}>
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Drop screenshot here or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Browse</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Pasted text */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Raw Text / Message Transcript
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste SMS content, WhatsApp chat snippet, phishing URL, or bank debit alert text..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: '0.85rem',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px' }}
          >
            {isUploading ? (
              <>Extracting structured fields...</>
            ) : (
              <>
                <Plus size={16} />
                <span>Ingest & Extract Item</span>
              </>
            )}
          </button>
        </form>

        {/* Quick hint for judges */}
        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <strong style={{ color: 'var(--text-muted)' }}>Forensic Pipeline:</strong> Every ingested item is assigned a SHA-256 chain-of-custody checksum and processed through structured extraction with field confidence scores.
        </div>
      </div>

      {/* Extracted Evidence Repository & Confirmation Tray */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Forensic Evidence Ledger ({evidenceList.length})</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Verify extracted attributes or make manual adjustments prior to timeline assembly.
            </p>
          </div>

          {evidenceList.length > 0 && (
            <button
              onClick={onBuildTimeline}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
            >
              <span>Build Reconciled Timeline</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {evidenceList.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FileText size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>No evidence ingested yet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '420px', margin: '8px auto 20px' }}>
              Upload bank notifications, WhatsApp screenshots, or click <strong>"Load 1-Click Demo Case"</strong> in the top header to load a ready scenario.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {evidenceList.map((item, idx) => {
              const ext = item.extraction || {};
              const isEditing = editingId === item.id;

              return (
                <div key={item.id} className="glass-panel" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    
                    {/* Header info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-evidence-type">
                        #{idx + 1} {item.evidence_type}
                      </span>
                      {ext.extraction_confidence && (
                        <span className={`badge badge-confidence-${ext.extraction_confidence}`}>
                          {ext.extraction_confidence} Confidence
                        </span>
                      )}
                      {item.sha256_hash && (
                        <span className="badge badge-forensic-hash" title={`SHA-256: ${item.sha256_hash}`}>
                          SHA-256: {item.sha256_hash.substring(0, 10)}...
                        </span>
                      )}
                    </div>

                    {/* Edit trigger */}
                    <div>
                      {isEditing ? (
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#34d399' }}
                        >
                          <Save size={14} />
                          <span>Save Changes</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditing(item)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          title="Manually correct extracted fields"
                        >
                          <Edit3 size={14} />
                          <span>Edit Extraction</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary / Content */}
                  <div style={{ margin: '14px 0', fontSize: '0.9rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={editForm.raw_text_summary}
                        onChange={(e) => setEditForm({ ...editForm, raw_text_summary: e.target.value })}
                        style={{ width: '100%', background: 'transparent', color: '#fff', border: 'none', outline: 'none', resize: 'vertical' }}
                      />
                    ) : (
                      ext.raw_text_summary || item.raw_text || "No summary available"
                    )}
                  </div>

                  {/* Key structured fields grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px' }}>
                    
                    {/* Timestamp */}
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Timestamp</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.timestamp}
                          onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
                          placeholder="2026-09-26T10:00:00Z"
                          style={{ width: '100%', padding: '4px 6px', background: '#000', color: '#fff', border: '1px solid var(--border-medium)', borderRadius: '4px' }}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: ext.timestamp ? '#fff' : 'var(--danger)' }}>
                          {ext.timestamp ? ext.timestamp.replace('T', ' ').replace('Z', ' UTC') : 'Missing Timestamp'}
                        </span>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Amount</span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          placeholder="5000"
                          style={{ width: '100%', padding: '4px 6px', background: '#000', color: '#fff', border: '1px solid var(--border-medium)', borderRadius: '4px' }}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: ext.amount ? '#38bdf8' : 'var(--text-dim)' }}>
                          {ext.amount !== null && ext.amount !== undefined ? `${ext.currency || 'INR'} ${ext.amount}` : 'N/A'}
                        </span>
                      )}
                    </div>

                    {/* Txn ID */}
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Transaction ID</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.transaction_id}
                          onChange={(e) => setEditForm({ ...editForm, transaction_id: e.target.value })}
                          placeholder="UPI12345"
                          style={{ width: '100%', padding: '4px 6px', background: '#000', color: '#fff', border: '1px solid var(--border-medium)', borderRadius: '4px' }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', color: ext.transaction_id ? '#cbd5e1' : 'var(--text-dim)' }}>
                          {ext.transaction_id || 'None'}
                        </span>
                      )}
                    </div>

                    {/* Sender */}
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Sender / Contact</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.sender}
                          onChange={(e) => setEditForm({ ...editForm, sender: e.target.value })}
                          placeholder="HDFC-BANK"
                          style={{ width: '100%', padding: '4px 6px', background: '#000', color: '#fff', border: '1px solid var(--border-medium)', borderRadius: '4px' }}
                        />
                      ) : (
                        <span style={{ color: ext.sender ? '#e2e8f0' : 'var(--text-dim)' }}>
                          {ext.sender || (ext.phone_numbers && ext.phone_numbers[0]) || 'Unspecified'}
                        </span>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
