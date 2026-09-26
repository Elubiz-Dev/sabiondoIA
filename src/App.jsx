import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { PomodoroModal } from './components/PomodoroModal';
import { FlashcardsModal } from './components/FlashcardsModal';
import { NotesDrawer } from './components/NotesDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ACADEMIC_MODES } from './constants/modes';
import { generateStyledExportHTML } from './utils/exportNotes';
import confetti from 'canvas-confetti';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export default function App() {
  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('sabiondo_theme') || 'dark');
  
  // App State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('general');
  const [chats, setChats] = useState(() => {
    try {
      const raw = localStorage.getItem('sabiondo_chats');
      const parsed = raw ? JSON.parse(raw) : [];
      // Auto-limpieza de chats temporales de más de 12 horas
      const now = Date.now();
      const fresh = parsed.filter((c) => !c.updatedAt || now - c.updatedAt < TWELVE_HOURS_MS);
      if (fresh.length !== parsed.length) {
        localStorage.setItem('sabiondo_chats', JSON.stringify(fresh));
      }
      return fresh;
    } catch {
      return [];
    }
  });

  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Settings State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sabiondo_api_key') || '');
  const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem('sabiondo_temp') || '0.7'));

  // Notes State
  const [notes, setNotes] = useState(() => localStorage.getItem('sabiondo_notes') || '');

  // Modals & Drawers
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sabiondo_theme', theme);
  }, [theme]);

  // Check server status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setIsOnline(data.hasServerKey || Boolean(apiKey && apiKey.length > 5));
      })
      .catch(() => setIsOnline(false));
  }, [apiKey]);

  // Toast Helper
  const showToast = (message, type = 'normal') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Toggle Theme
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast(`Tema cambiado a modo ${next === 'dark' ? 'Oscuro' : 'Claro'}`);
  };

  // Chat Actions
  const handleNewChat = () => {
    setCurrentChatId('chat_' + Date.now());
    setMessages([]);
    setUserInput('');
    setSidebarOpen(false);
  };

  // Switch mode and automatically start a fresh chat if the current one has messages
  const handleSelectMode = (modeId) => {
    setActiveMode(modeId);
    const modeName = ACADEMIC_MODES.find((x) => x.id === modeId)?.name || 'Modo';
    if (messages.length > 0) {
      setCurrentChatId('chat_' + Date.now());
      setMessages([]);
      setUserInput('');
      showToast(`Nuevo chat: ${modeName}`);
    } else {
      showToast(`Modo activo: ${modeName}`);
    }
  };

  const handleSelectChat = (chatId) => {
    const found = chats.find((c) => c.id === chatId);
    if (found) {
      setCurrentChatId(found.id);
      setMessages(found.messages || []);
      if (found.mode) setActiveMode(found.mode);
      setSidebarOpen(false);
    }
  };

  const handleDeleteChat = (chatId) => {
    const next = chats.filter((c) => c.id !== chatId);
    setChats(next);
    localStorage.setItem('sabiondo_chats', JSON.stringify(next));
    if (currentChatId === chatId) {
      handleNewChat();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Deseas vaciar todo el historial de estudio?')) {
      setChats([]);
      localStorage.removeItem('sabiondo_chats');
      handleNewChat();
      showToast('Historial vaciado');
    }
  };

  // Save current chat
  const saveChatHistory = (updatedMessages) => {
    if (updatedMessages.length === 0) return;
    const firstUser = updatedMessages.find((m) => m.role === 'user');
    const title = firstUser
      ? firstUser.content.slice(0, 32) + (firstUser.content.length > 32 ? '...' : '')
      : 'Consulta Académica';

    const chatId = currentChatId || 'chat_' + Date.now();
    setCurrentChatId(chatId);

    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === chatId);
      const chatData = {
        id: chatId,
        title,
        mode: activeMode,
        updatedAt: Date.now(),
        messages: updatedMessages
      };
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = chatData;
      } else {
        next = [chatData, ...prev];
      }
      localStorage.setItem('sabiondo_chats', JSON.stringify(next));
      return next;
    });
  };

  // Send Message
  const handleSendMessage = async () => {
    const text = userInput.trim();
    if (!text || isGenerating) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setUserInput('');
    setIsGenerating(true);

    const modeObj = ACADEMIC_MODES.find((m) => m.id === activeMode) || ACADEMIC_MODES[0];
    const systemPrompt = modeObj.systemPrompt;

    let fullAssistantText = '';
    const isVercel = !window.location.hostname.includes('localhost');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;

      const body = JSON.stringify({
        messages: [{ role: 'system', content: systemPrompt }, ...newMessages],
        temperature
      });

      if (isVercel) {
        // Vercel Serverless Function
        const res = await fetch('/api/chat', { method: 'POST', headers, body });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (res.status === 401 && (!apiKey || apiKey.length < 5)) {
            fullAssistantText = `### 🦉 ¡Hola! Soy Sabiondo AI\n*Creado por Daniela Romero y Mayra Barrios*\n\nPara activar respuestas:\n1. Abre **Ajustes ⚙️** en el menú.\n2. Pega tu clave de [Groq Console](https://console.groq.com/keys) o [Google AI Studio](https://aistudio.google.com/app/apikey).`;
            setMessages([...newMessages, { role: 'assistant', content: fullAssistantText }]);
            saveChatHistory([...newMessages, { role: 'assistant', content: fullAssistantText }]);
            setIsGenerating(false);
            return;
          }
          throw new Error(err.error || `Error ${res.status}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        fullAssistantText = data.content || '';

      } else {
        // Local streaming
        const res = await fetch('/api/chat', { method: 'POST', headers, body });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (res.status === 401 && (!apiKey || apiKey.length < 5)) {
            fullAssistantText = `### 🦉 ¡Hola! Soy Sabiondo AI\n*Creado por Daniela Romero y Mayra Barrios*\n\nPara activar respuestas:\n1. Abre **Ajustes ⚙️** en el menú.\n2. Pega tu clave de [Groq Console](https://console.groq.com/keys) o [Google AI Studio](https://aistudio.google.com/app/apikey).`;
            setMessages([...newMessages, { role: 'assistant', content: fullAssistantText }]);
            saveChatHistory([...newMessages, { role: 'assistant', content: fullAssistantText }]);
            setIsGenerating(false);
            return;
          }
          throw new Error(err.error || `Error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        setMessages([...newMessages, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.replace(/^data: /, '');
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {
                fullAssistantText += parsed.content;
                setMessages([...newMessages, { role: 'assistant', content: fullAssistantText }]);
              }
            } catch (e) { console.error(e); }
          }
        }
      }

      const finalMessages = [...newMessages, { role: 'assistant', content: fullAssistantText }];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      if (activeMode === 'quiz') confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });

    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: `⚠️ **Error:** ${err.message}` }]);
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Voice input (dictation)
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Tu navegador no soporta dictado por voz', 'error');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'es-ES';
    rec.onstart = () => {
      setIsRecording(true);
      showToast('Escuchando tu pregunta...', 'success');
    };
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setUserInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    rec.start();
  };

  // Export Chat — Documento Estilizado con opción a PDF
  const handleExport = () => {
    if (messages.length === 0) {
      showToast('No hay apuntes para exportar en esta consulta', 'error');
      return;
    }
    const modeObj = ACADEMIC_MODES.find((m) => m.id === activeMode) || ACADEMIC_MODES[0];
    const htmlContent = generateStyledExportHTML({
      messages,
      modeName: modeObj.name,
      activeModeIcon: modeObj.icon
    });

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Apuntes_Sabiondo_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('¡Guía de estudio descargada! Ábrela para ver el diseño o guardar en PDF 📄', 'success');
  };

  // Save Settings
  const handleSaveSettings = (newKey, newTemp) => {
    localStorage.setItem('sabiondo_api_key', newKey);
    localStorage.setItem('sabiondo_temp', newTemp.toString());
    setIsOnline(Boolean(newKey && newKey.length > 5));
    showToast('Ajustes guardados con éxito', 'success');
  };

  return (
    <div className="app-layout">
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        onNewChat={handleNewChat}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onClearHistory={handleClearHistory}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
        onOpenFlashcards={() => setIsFlashcardsOpen(true)}
        onOpenNotes={() => setIsNotesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOnline={isOnline}
      />

      <ChatArea
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeMode={activeMode}
        messages={messages}
        userInput={userInput}
        setUserInput={setUserInput}
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        isRecording={isRecording}
        onToggleVoice={handleToggleVoice}
        theme={theme}
        onToggleTheme={toggleTheme}
        onExport={handleExport}
      />

      {/* Modals & Drawer */}
      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
      />

      <FlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
      />

      <NotesDrawer
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={notes}
        setNotes={setNotes}
        onSaveNotes={() => {
          localStorage.setItem('sabiondo_notes', notes);
          showToast('Notas guardadas con éxito', 'success');
        }}
        onSummarizeNotes={() => {
          if (!notes.trim()) {
            showToast('Escribe algo en tus notas primero', 'error');
            return;
          }
          setIsNotesOpen(false);
          setUserInput(`Por favor resume mis siguientes apuntes y crea 3 preguntas de repaso:\n\n"""\n${notes}\n"""`);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        temperature={temperature}
        setTemperature={setTemperature}
        onSave={handleSaveSettings}
      />

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === 'error' ? '⚠️' : '✨'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
