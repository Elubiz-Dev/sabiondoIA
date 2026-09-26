import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Layers, Plus, Trash2, RotateCcw, Check } from 'lucide-react';
import { INITIAL_FLASHCARDS } from '../constants/modes';
import katex from 'katex';

function renderCardMath(text) {
  if (!text) return '';
  // Convert $$ ... $$ to KaTeX display
  let out = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return math;
    }
  });
  // Convert $ ... $ to KaTeX inline
  out = out.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return math;
    }
  });
  return out;
}

export function FlashcardsModal({ isOpen, onClose }) {
  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem('sabiondo_flashcards');
      return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
    } catch {
      return INITIAL_FLASHCARDS;
    }
  });

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  useEffect(() => {
    localStorage.setItem('sabiondo_flashcards', JSON.stringify(cards));
  }, [cards]);

  if (!isOpen) return null;

  const validIndex = Math.min(index, Math.max(0, cards.length - 1));
  const currentCard = cards[validIndex] || { q: 'No hay tarjetas', a: 'Crea una tarjeta nueva con el botón "+ Nueva Tarjeta"' };

  const handleNext = () => {
    if (cards.length <= 1) return;
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  };

  const handlePrev = () => {
    if (cards.length <= 1) return;
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newQ.trim() || !newA.trim()) return;
    const newCard = {
      id: 'fc_' + Date.now(),
      q: newQ.trim(),
      a: newA.trim()
    };
    const updated = [...cards, newCard];
    setCards(updated);
    setIndex(updated.length - 1);
    setNewQ('');
    setNewA('');
    setIsAdding(false);
    setFlipped(false);
  };

  const handleDeleteCard = () => {
    if (cards.length <= 1) {
      alert('Debes mantener al menos una tarjeta.');
      return;
    }
    const updated = cards.filter((_, i) => i !== validIndex);
    setCards(updated);
    setIndex(Math.max(0, validIndex - 1));
    setFlipped(false);
  };

  const handleRestoreDefault = () => {
    if (window.confirm('¿Restablecer a las flashcards de estudio por defecto?')) {
      setCards(INITIAL_FLASHCARDS);
      setIndex(0);
      setFlipped(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Layers className="modal-icon" size={24} color="#818CF8" />
            <div>
              <h3>Flashcards de Memoria Activa</h3>
              <p>Repasa conceptos clave y fórmulas antes de tu examen</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {isAdding ? (
            <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>✨ Crear Nueva Tarjeta</h4>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Pregunta o Concepto:
                </label>
                <textarea
                  className="chat-textarea"
                  style={{ width: '100%', minHeight: '65px', fontSize: '0.9rem' }}
                  placeholder="Ej: ¿Qué es la Fotosíntesis?"
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Respuesta Explicada:
                </label>
                <textarea
                  className="chat-textarea"
                  style={{ width: '100%', minHeight: '75px', fontSize: '0.9rem' }}
                  placeholder="Ej: Proceso biológico en plantas donde la luz solar se convierte en energía química (glucosa)..."
                  value={newA}
                  onChange={(e) => setNewA(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Guardar Tarjeta
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flashcard-scene" onClick={() => setFlipped(!flipped)}>
                <div className={`flashcard-3d ${flipped ? 'flipped' : ''}`}>
                  <div className="card-face card-front">
                    <span className="card-tag">Pregunta / Concepto</span>
                    <div
                      style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.4 }}
                      dangerouslySetInnerHTML={{ __html: renderCardMath(currentCard.q) }}
                    />
                    <span className="flip-hint">👆 Toca para ver la respuesta</span>
                  </div>
                  <div className="card-face card-back">
                    <span className="card-tag">Respuesta Explicada</span>
                    <div
                      style={{ fontSize: '0.95rem', lineHeight: 1.45 }}
                      dangerouslySetInnerHTML={{ __html: renderCardMath(currentCard.a) }}
                    />
                    <span className="flip-hint">👆 Toca para volver a la pregunta</span>
                  </div>
                </div>
              </div>

              <div className="flashcard-nav" style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={handlePrev} disabled={cards.length <= 1}>
                  <ChevronLeft size={18} /> Anterior
                </button>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {cards.length > 0 ? `${validIndex + 1} / ${cards.length}` : '0 / 0'}
                </span>
                <button className="btn btn-secondary" onClick={handleNext} disabled={cards.length <= 1}>
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setIsAdding(true)}>
                    <Plus size={14} /> Nueva Tarjeta
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }} onClick={handleRestoreDefault} title="Restablecer">
                    <RotateCcw size={14} />
                  </button>
                </div>
                {cards.length > 1 && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-coral)' }}
                    onClick={handleDeleteCard}
                    title="Eliminar esta tarjeta"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
