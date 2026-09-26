import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Layers } from 'lucide-react';
import { INITIAL_FLASHCARDS } from '../constants/modes';

export function FlashcardsModal({ isOpen, onClose }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!isOpen) return null;

  const currentCard = INITIAL_FLASHCARDS[index];

  const handleNext = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % INITIAL_FLASHCARDS.length);
  };

  const handlePrev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + INITIAL_FLASHCARDS.length) % INITIAL_FLASHCARDS.length);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Layers className="modal-icon" size={24} color="#818CF8" />
            <div>
              <h3>Flashcards 3D de Memoria Activa</h3>
              <p>Toca la tarjeta para voltearla y ver la respuesta</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="flashcard-scene" onClick={() => setFlipped(!flipped)}>
            <div className={`flashcard-3d ${flipped ? 'flipped' : ''}`}>
              <div className="card-face card-front">
                <span className="card-tag">Pregunta / Concepto</span>
                <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>{currentCard.q}</p>
                <span className="flip-hint">👆 Toca para voltear</span>
              </div>
              <div className="card-face card-back">
                <span className="card-tag">Respuesta Explicada</span>
                <p style={{ fontSize: '0.95rem' }}>{currentCard.a}</p>
                <span className="flip-hint">👆 Toca para regresar</span>
              </div>
            </div>
          </div>

          <div className="flashcard-nav">
            <button className="btn btn-secondary" onClick={handlePrev}>
              <ChevronLeft size={18} /> Anterior
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {index + 1} / {INITIAL_FLASHCARDS.length}
            </span>
            <button className="btn btn-secondary" onClick={handleNext}>
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
