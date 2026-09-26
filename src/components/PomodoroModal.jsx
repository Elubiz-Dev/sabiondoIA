import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export function PomodoroModal({ isOpen, onClose }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak]);

  if (!isOpen) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card pomodoro-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <Clock className="modal-icon" size={24} color="#818CF8" />
            <div>
              <h3>Temporizador Pomodoro</h3>
              <p>25 min de enfoque + 5 min de descanso</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="timer-display">{timeFormatted}</div>
          <div className="timer-mode-label">
            {isBreak ? '☕ Descanso Activo (5 min)' : '📚 Sesión de Estudio Intensivo (25 min)'}
          </div>

          <div className="timer-controls">
            <button className="btn btn-primary" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={18} />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
