import React from 'react';
import { X, Save, Zap, FileText } from 'lucide-react';

export function NotesDrawer({
  isOpen,
  onClose,
  notes,
  setNotes,
  onSaveNotes,
  onSummarizeNotes
}) {
  return (
    <div className={`notes-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <div className="drawer-title">
          <FileText size={20} color="#818CF8" />
          <h3>Mis Notas de Estudio</h3>
        </div>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="drawer-body">
        <textarea
          className="drawer-textarea"
          placeholder="Escribe tus apuntes rápidos, conceptos o dudas aquí durante tu clase..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="drawer-footer">
        <button className="btn btn-secondary" onClick={onSaveNotes}>
          <Save size={16} />
          <span>Guardar Notas</span>
        </button>
        <button className="btn btn-primary" onClick={onSummarizeNotes}>
          <Zap size={16} />
          <span>Resumir con Sabiondo</span>
        </button>
      </div>
    </div>
  );
}
