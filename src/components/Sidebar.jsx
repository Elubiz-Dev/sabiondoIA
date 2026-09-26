import React from 'react';
import { Plus, Clock, Layers, FileText, Settings, Trash2, X, Sparkles, MessageSquare } from 'lucide-react';
import { ACADEMIC_MODES } from '../constants/modes';

export function Sidebar({
  isOpen,
  onClose,
  activeMode,
  onSelectMode,
  onNewChat,
  chats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onClearHistory,
  onOpenPomodoro,
  onOpenFlashcards,
  onOpenNotes,
  onOpenSettings,
  isOnline
}) {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-avatar">
              <span className="brand-emoji">🦉</span>
            </div>
            <div className="brand-text">
              <h1 className="brand-title">Sabiondo <span>AI</span></h1>
              <span className="brand-badge">PRO EDU</span>
            </div>
          </div>
          <button className="icon-btn close-sidebar-btn" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <button className="btn btn-primary new-chat-btn" onClick={onNewChat}>
          <Plus size={18} strokeWidth={2.5} />
          <span>Nueva Consulta</span>
        </button>

        {/* Study tools */}
        <div className="sidebar-tools-grid">
          <button className="study-tool-card" onClick={onOpenPomodoro} title="Temporizador Pomodoro">
            <span className="tool-icon">⏱️</span>
            <span className="tool-name">Pomodoro</span>
          </button>
          <button className="study-tool-card" onClick={onOpenFlashcards} title="Tarjetas de Memoria">
            <span className="tool-icon">🃏</span>
            <span className="tool-name">Flashcards</span>
          </button>
          <button className="study-tool-card" onClick={onOpenNotes} title="Bloc de Notas">
            <span className="tool-icon">📝</span>
            <span className="tool-name">Mis Notas</span>
          </button>
        </div>

        {/* Academic Modes */}
        <div className="sidebar-section">
          <div className="section-header-row">
            <h3 className="section-label">Modo de Aprendizaje</h3>
          </div>
          <div className="mode-pills-list">
            {ACADEMIC_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`mode-pill ${activeMode === mode.id ? 'active' : ''}`}
                onClick={() => {
                  onSelectMode(mode.id);
                  onClose();
                }}
              >
                <span className="mode-icon">{mode.icon}</span>
                <div className="mode-text">
                  <strong>{mode.name}</strong>
                  <small>{mode.desc}</small>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        <div className="sidebar-section chat-history-section">
          <div className="section-header-row">
            <h3 className="section-label">Consultas Recientes</h3>
            {chats.length > 0 && (
              <button className="clear-history-btn" onClick={onClearHistory} title="Vaciar">
                Vaciar
              </button>
            )}
          </div>
          <div className="history-list">
            {chats.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Sin consultas recientes (auto-limpieza activa)
              </div>
            ) : (
              chats.map((c) => {
                const modeObj = ACADEMIC_MODES.find((m) => m.id === c.mode);
                const modeIcon = modeObj?.icon || '💬';
                return (
                  <div
                    key={c.id}
                    className={`history-item ${c.id === currentChatId ? 'active' : ''}`}
                    onClick={() => onSelectChat(c.id)}
                  >
                    <span style={{ fontSize: '0.9rem', marginRight: '4px' }}>{modeIcon}</span>
                    <span className="history-title">{c.title}</span>
                    <button
                      className="history-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(c.id);
                      }}
                      title="Eliminar consulta"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer with Authors & Settings */}
        <div className="sidebar-footer">
          <div className="authors-badge">
            <Sparkles size={16} color="#818CF8" />
            <div className="authors-info">
              <span className="authors-label">Proyecto desarrollado por:</span>
              <strong className="authors-names">Daniela Romero & Mayra Barrios</strong>
            </div>
          </div>

          <div className="api-status-card">
            <span
              className="status-dot"
              style={{ backgroundColor: isOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}
            ></span>
            <div className="status-info">
              <strong>{isOnline ? 'Sabiondo AI Activo' : 'Modo Demostración'}</strong>
              <small>{isOnline ? 'Listo para responder' : 'Configura clave en ajustes'}</small>
            </div>
          </div>

          <button className="btn btn-secondary settings-btn" onClick={onOpenSettings} title="Ajustes">
            <Settings size={18} />
            <span>Ajustes & Conexión</span>
          </button>
        </div>
      </aside>

      {isOpen && <div className="sidebar-overlay active" onClick={onClose}></div>}
    </>
  );
}
