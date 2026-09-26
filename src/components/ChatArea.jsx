import React, { useRef, useEffect } from 'react';
import { Menu, Download, Moon, Sun, Mic, Send, X, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ACADEMIC_MODES } from '../constants/modes';

export function ChatArea({
  onToggleSidebar,
  activeMode,
  messages,
  userInput,
  setUserInput,
  onSendMessage,
  isGenerating,
  isRecording,
  onToggleVoice,
  theme,
  onToggleTheme,
  onExport,
  onSpeakText
}) {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const currentModeObj = ACADEMIC_MODES.find((m) => m.id === activeMode) || ACADEMIC_MODES[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleInput = (e) => {
    setUserInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  };

  const setPrompt = (text) => {
    setUserInput(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <main className="chat-main">
      {/* Cabecera Superior */}
      <header className="main-header">
        <div className="header-left">
          <button className="icon-btn mobile-menu-btn" onClick={onToggleSidebar} title="Menú">
            <Menu size={22} />
          </button>
          <div className="active-mode-badge">
            <span>{currentModeObj.icon}</span>
            <span>{currentModeObj.name}</span>
          </div>
          <div className="header-authors-tag">
            <Sparkles size={14} color="#818CF8" />
            <span>Hecho por <strong>Daniela Romero & Mayra Barrios</strong></span>
          </div>
        </div>

        <div className="header-right">
          <button className="header-action-btn" onClick={onExport} title="Exportar sesión">
            <Download size={16} />
            <span>Exportar</span>
          </button>
          <button className="header-action-btn icon-only" onClick={onToggleTheme} title="Cambiar tema">
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="welcome-hero">
            <div className="hero-top-badge">
              <Sparkles size={14} /> Tu Compañero de Estudio 24/7
            </div>

            <div className="hero-avatar">🦉</div>

            <h2 className="hero-title">
              Aprende más rápido con <span className="gradient-text">Sabiondo AI</span>
            </h2>
            <p className="hero-subtitle">
              Tu tutor inteligente para resolver dudas, repasar ejercicios y aprender mejor.
            </p>

            {/* Materias */}
            <div className="subject-chips-row">
              {['📐 Matemáticas', '⚛️ Física & Química', '💻 Código & Algoritmos', '🏛️ Historia', '✍️ Ensayos & APA', '🧬 Biología'].map((s) => (
                <button
                  key={s}
                  className="subject-chip"
                  onClick={() => setPrompt(`Quiero repasar el tema principal de ${s}. ¿Por dónde empezamos?`)}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Starter Cards */}
            <div className="starter-cards-grid">
              <div
                className="starter-card"
                onClick={() => setPrompt('Explícame cómo resolver integrales por partes paso a paso con su fórmula general en LaTeX y un ejemplo.')}
              >
                <div className="card-icon-box">📐</div>
                <div>
                  <h4>Cálculo: Integrales por partes</h4>
                  <p>Paso a paso con fórmulas en LaTeX y demostración</p>
                </div>
              </div>

              <div
                className="starter-card"
                onClick={() => setPrompt('Explica el ciclo de Krebs en bioquímica con una tabla resumen de insumos/productos y un esquema para memorizar.')}
              >
                <div className="card-icon-box">🧬</div>
                <div>
                  <h4>Ciclo de Krebs & Bioquímica</h4>
                  <p>Tabla de repaso didáctica e ideas clave</p>
                </div>
              </div>

              <div
                className="starter-card"
                onClick={() => setPrompt('Crea un Quiz de 4 preguntas de opción múltiple sobre la Revolución Industrial con soluciones explicadas.')}
              >
                <div className="card-icon-box">⚡</div>
                <div>
                  <h4>Quiz Interactivo de Historia</h4>
                  <p>Preguntas con justificación para tu examen</p>
                </div>
              </div>

              <div
                className="starter-card"
                onClick={() => setPrompt('Dame una guía completa para citar libros, artículos y páginas web según las normas APA 7ma edición.')}
              >
                <div className="card-icon-box">✍️</div>
                <div>
                  <h4>Normas APA 7ma Edición</h4>
                  <p>Ejemplos de referencias para tu tesis o ensayo</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} onSpeak={onSpeakText} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="chat-input-wrapper">
        <div className="input-quick-tools">
          <span className="tools-label">⚡ Acciones:</span>
          <button className="quick-chip" onClick={() => setPrompt('Explícame el paso a paso detallado de: ')}>
            🔍 Explicar paso a paso
          </button>
          <button className="quick-chip" onClick={() => setPrompt('Crea un Quiz de 4 preguntas de opción múltiple sobre: ')}>
            📝 Generar Quiz
          </button>
          <button className="quick-chip" onClick={() => setPrompt('Resume en 5 puntos clave y un glosario breve: ')}>
            📑 Resumir en 5 ideas
          </button>
          <button className="quick-chip" onClick={() => setPrompt('Crea 3 pares de pregunta y respuesta clave tipo Flashcard sobre: ')}>
            🃏 Crear Flashcards
          </button>
        </div>

        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSendMessage();
          }}
        >
          <div className="input-box">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              rows={1}
              placeholder="Escribe tu pregunta académica, pega un ejercicio o pide un resumen..."
              value={userInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
            />

            <div className="input-actions-group">
              <button
                type="button"
                className={`tool-icon-btn ${isRecording ? 'recording' : ''}`}
                onClick={onToggleVoice}
                title="Dictar por voz"
              >
                <Mic size={19} />
              </button>

              {userInput.trim() && (
                <button
                  type="button"
                  className="tool-icon-btn"
                  onClick={() => setUserInput('')}
                  title="Limpiar"
                >
                  <X size={17} />
                </button>
              )}

              <button
                type="submit"
                className="send-submit-btn"
                disabled={!userInput.trim() || isGenerating}
                title="Enviar Consulta"
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>

        <div className="input-footer-info">
          🦉 Sabiondo AI — Hecho por <strong>Daniela Romero & Mayra Barrios</strong>. Presiona <strong>Enter</strong> para enviar.
        </div>
      </div>
    </main>
  );
}
