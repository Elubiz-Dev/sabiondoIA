import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, Cpu, Zap } from 'lucide-react';

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq - Ultra Rápido)', provider: 'groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Groq - Instantáneo)', provider: 'groq' },
  { id: 'openai/gpt-oss-20b', name: 'OpenAI GPT-OSS 20B (OpenRouter)', provider: 'openrouter' },
  { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B (OpenRouter)', provider: 'openrouter' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Google AI Studio)', provider: 'gemini' },
  { id: 'custom', name: 'Otro Modelo Personalizado...', provider: 'custom' }
];

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  temperature,
  setTemperature,
  autoVoice,
  setAutoVoice,
  onSave
}) {
  const [showKey, setShowKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempModel, setTempModel] = useState(selectedModel || 'llama-3.3-70b-versatile');
  const [customModelName, setCustomModelName] = useState(
    AVAILABLE_MODELS.some(m => m.id === selectedModel) ? '' : (selectedModel || '')
  );
  const [tempTemperature, setTempTemperature] = useState(temperature);
  const [tempAutoVoice, setTempAutoVoice] = useState(autoVoice);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalModel = tempModel === 'custom' ? (customModelName.trim() || 'llama-3.3-70b-versatile') : tempModel;
    setApiKey(tempApiKey);
    setSelectedModel(finalModel);
    setTemperature(tempTemperature);
    setAutoVoice(tempAutoVoice);
    onSave(tempApiKey, finalModel, tempTemperature, tempAutoVoice);
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
              <p>Configura tu clave de IA, modelo y preferencias de estudio</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>
              <strong>Clave de API de Inteligencia Artificial</strong>
              <span className="badge-free">100% Gratuito</span>
            </label>
            <div className="input-with-toggle">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="gsk_... (Groq), AIzaSy... (Gemini) o sk-or-... (OpenRouter)"
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
                <span className="guide-badge" style={{ background: '#F59E0B', color: '#000' }}>Groq (Recomendado)</span>
                <div>
                  <strong>Groq API:</strong>{' '}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
                    Obtener clave gratis en Groq Console ↗
                  </a>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-badge gold">Google Gemini</span>
                <div>
                  <strong>Google AI Studio:</strong>{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                    Obtener clave gratis con Gmail ↗
                  </a>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-badge green">OpenRouter</span>
                <div>
                  <strong>OpenRouter:</strong>{' '}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                    Obtener clave en OpenRouter ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>
              <Cpu size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              <strong>Modelo de Inteligencia Artificial</strong>
            </label>
            <select
              className="model-select-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--bg-input, #1e293b)',
                color: 'var(--text-primary, #fff)',
                border: '1px solid var(--border-color, #334155)',
                marginBottom: tempModel === 'custom' ? '8px' : '0'
              }}
              value={AVAILABLE_MODELS.some(m => m.id === tempModel) ? tempModel : 'custom'}
              onChange={(e) => setTempModel(e.target.value)}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {tempModel === 'custom' && (
              <input
                type="text"
                placeholder="Ej: openai/gpt-oss-20b o openai/gpt-oss-120b"
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)',
                  color: 'var(--text-primary, #fff)',
                  border: '1px solid var(--border-color, #334155)',
                  marginTop: '6px'
                }}
              />
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label><strong>Nivel de Creatividad Pedagógica:</strong></label>
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

          <div className="form-group">
            <label><strong>Síntesis de Voz</strong></label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Leer automáticamente las respuestas de Sabiondo
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={tempAutoVoice}
                  onChange={(e) => setTempAutoVoice(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

