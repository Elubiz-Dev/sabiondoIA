import React, { useState } from 'react';
import { X, Key, Eye, EyeOff } from 'lucide-react';

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  temperature,
  setTemperature,
  onSave
}) {
  const [showKey, setShowKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempTemperature, setTempTemperature] = useState(temperature);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(tempApiKey);
    setTemperature(tempTemperature);
    onSave(tempApiKey, tempTemperature);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <Key className="modal-icon" size={24} color="#818CF8" />
            <div>
              <h3>Ajustes de Sabiondo AI</h3>
              <p>Configuración de API y preferencias</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>
              <strong>Clave de API</strong>
              <span className="badge-free">Gratis</span>
            </label>
            <div className="input-with-toggle">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="gsk_... (Groq) o AIzaSy... (Gemini)"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
              />
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="provider-guide-box">
              <div className="guide-item">
                <span className="guide-badge" style={{ background: '#F59E0B', color: '#000' }}>Groq</span>
                <div>
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
                    Obtener clave en Groq Console ↗
                  </a>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-badge gold">Gemini</span>
                <div>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                    Obtener clave en Google AI Studio ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label><strong>Nivel de Creatividad:</strong></label>
              <span style={{ fontFamily: 'var(--font-code)', color: 'var(--primary-light)', fontWeight: 700 }}>
                {tempTemperature}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={tempTemperature}
              onChange={(e) => setTempTemperature(parseFloat(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Exacto (0.2)</span>
              <span>Balanceado (0.7)</span>
              <span>Creativo (1.0)</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
