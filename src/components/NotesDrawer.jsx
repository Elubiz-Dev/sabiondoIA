import React, { useState, useEffect } from 'react';
import { X, Save, Zap, FileText, Copy, Trash2, Check } from 'lucide-react';

export function NotesDrawer({
  isOpen,
  onClose,
  notes,
  setNotes,
  onSaveNotes,
  onSummarizeNotes
}) {
  const [copied, setCopied] = useState(false);

  // Auto-guardado automático con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('sabiondo_notes', notes);
    }, 600);
    return () => clearTimeout(timer);
  }, [notes]);

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  const handleCopy = () => {
    if (!notes.trim()) return;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (notes.trim() && window.confirm('¿Borrar todos tus apuntes actuales?')) {
      setNotes('');
      localStorage.setItem('sabiondo_notes', '');
    }
  };

  return (
    <div className={`notes-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <div className="drawer-title">
          <FileText size={20} color="#818CF8" />
          <div>
            <h3>Mis Notas de Estudio</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Auto-guardado activo · {wordCount} palabras ({charCount} car.)
            </span>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} title="Cerrar">
          <X size={20} />
        </button>
      </div>

      <div className="drawer-body">
        <textarea
          className="drawer-textarea"
          placeholder="Escribe aquí tus apuntes rápidos, ejercicios de clase, ideas para tu ensayo o dudas..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="drawer-footer" style={{ flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopy} disabled={!notes.trim()} title="Copiar notas">
            {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.6rem' }} onClick={handleClear} disabled={!notes.trim()} title="Limpiar">
            <Trash2 size={16} color="var(--accent-coral)" />
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onSaveNotes}>
            <Save size={16} />
            <span>Guardar</span>
          </button>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onSummarizeNotes} disabled={!notes.trim()}>
          <Zap size={16} />
          <span>Resumir & Preguntas con Sabiondo</span>
        </button>
      </div>
    </div>
  );
}
