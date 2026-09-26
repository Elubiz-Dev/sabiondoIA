import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Clock, Bell, Sparkles, Coffee, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

// Reproductor de sonido con Web Audio API (no requiere archivos externos)
function playAlarmSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.3); // D6
    gain2.gain.setValueAtTime(0.2, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.3);
    osc2.stop(now + 1.2);
  } catch (e) {
    console.log('Audio not allowed without gesture', e);
  }
}

export function PomodoroModal({ isOpen, onClose }) {
  const [selectedDuration, setSelectedDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('study'); // 'study' | 'shortBreak' | 'longBreak'
  const [completedSessions, setCompletedSessions] = useState(() => {
    return parseInt(localStorage.getItem('sabiondo_pomodoros_count') || '0', 10);
  });

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playAlarmSound();
      confetti({ particleCount: 80, spread: 75, origin: { y: 0.6 } });

      if (mode === 'study') {
        const nextCount = completedSessions + 1;
        setCompletedSessions(nextCount);
        localStorage.setItem('sabiondo_pomodoros_count', nextCount.toString());
        // Switch to break
        if (nextCount % 4 === 0) {
          setMode('longBreak');
          setTimeLeft(15 * 60);
          setSelectedDuration(15 * 60);
        } else {
          setMode('shortBreak');
          setTimeLeft(5 * 60);
          setSelectedDuration(5 * 60);
        }
      } else {
        setMode('study');
        setTimeLeft(25 * 60);
        setSelectedDuration(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, completedSessions]);

  if (!isOpen) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const setPreset = (type, seconds) => {
    setIsRunning(false);
    setMode(type);
    setSelectedDuration(seconds);
    setTimeLeft(seconds);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card pomodoro-card" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Clock className="modal-icon" size={24} color="#818CF8" />
            <div>
              <h3>Temporizador de Enfoque Pomodoro</h3>
              <p>Mejora tu concentración y evita la fatiga mental</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-secondary ${mode === 'study' && selectedDuration === 25 * 60 ? 'active' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setPreset('study', 25 * 60)}
            >
              📚 Estudio 25m
            </button>
            <button
              className={`btn btn-secondary ${mode === 'study' && selectedDuration === 50 * 60 ? 'active' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setPreset('study', 50 * 60)}
            >
              🔥 Intenso 50m
            </button>
            <button
              className={`btn btn-secondary ${mode === 'shortBreak' ? 'active' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setPreset('shortBreak', 5 * 60)}
            >
              ☕ Pausa 5m
            </button>
            <button
              className={`btn btn-secondary ${mode === 'longBreak' ? 'active' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setPreset('longBreak', 15 * 60)}
            >
              🌿 Descanso 15m
            </button>
          </div>

          <div className="timer-display">{timeFormatted}</div>

          <div className="timer-mode-label" style={{ marginTop: '0.5rem' }}>
            {mode === 'study' && '📚 Sesión de Estudio Activo — ¡Cero distracciones!'}
            {mode === 'shortBreak' && '☕ Descanso Corto (5 min) — Bebe agua o estira'}
            {mode === 'longBreak' && '🌿 Descanso Largo (15 min) — ¡Excelente trabajo!'}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.75rem 0', textAlign: 'center' }}>
            🎯 Pomodoros completados hoy: <strong style={{ color: 'var(--accent-purple)' }}>{completedSessions}</strong>
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
