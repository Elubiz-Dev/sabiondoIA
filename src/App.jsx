import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { PomodoroModal } from './components/PomodoroModal';
import { FlashcardsModal } from './components/FlashcardsModal';
import { NotesDrawer } from './components/NotesDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ACADEMIC_MODES } from './constants/modes';
import confetti from 'canvas-confetti';

export default function App() {
  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('sabiondo_theme') || 'dark');
  
  // App State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('general');
  const [chats, setChats] = useState(() => JSON.parse(localStorage.getItem('sabiondo_chats') || '[]'));
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Settings State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sabiondo_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('sabiondo_model') || 'llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem('sabiondo_temp') || '0.7'));
  const [autoVoice, setAutoVoice] = useState(() => localStorage.getItem('sabiondo_auto_voice') === 'true');

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

  // Send Message with SSE streaming
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

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [{ role: 'system', content: systemPrompt }, ...newMessages],
          temperature,
          model: selectedModel
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 && (!apiKey || apiKey.length < 5)) {
          // Demo fallback
          fullAssistantText = `### 🦉 ¡Hola! Soy Sabiondo AI\n*Creado por Daniela Romero y Mayra Queso*\n\nHe recibido tu consulta sobre: **"${text}"**.\n\nPara activar las respuestas en tiempo real con **Groq**, **Google Gemini** o **OpenRouter**:\n1. Abre **Ajustes & Conexión ⚙️** en el menú.\n2. Pega tu clave gratuita de [Groq Console](https://console.groq.com/keys) o [Google AI Studio](https://aistudio.google.com/app/apikey).\n\n*¡Mientras tanto, puedes usar el Pomodoro, las Flashcards 3D y el Bloc de Notas!*`;
          const finalMessages = [...newMessages, { role: 'assistant', content: fullAssistantText }];
          setMessages(finalMessages);
          saveChatHistory(finalMessages);
          setIsGenerating(false);
          return;
        }
        throw new Error(err.error || `Error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      // Create placeholder assistant message
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
          } catch (e) {
            console.error(e);
          }
        }
      }

      const finalMessages = [...newMessages, { role: 'assistant', content: fullAssistantText }];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

      if (autoVoice) speakText(fullAssistantText);
      if (activeMode === 'quiz') confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });

    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: `⚠️ **Error:** ${err.message}` }]);
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Voice output
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/```[\s\S]*?```/g, 'código').replace(/[$#*_>`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  };

  // Voice input
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

  // Export Chat
  const handleExport = () => {
    if (messages.length === 0) {
      showToast('No hay apuntes para exportar', 'error');
      return;
    }
    let md = `# Apuntes de Estudio — Sabiondo AI\n*Hecho por Daniela Romero y Mayra Queso*\n\n`;
    md += `* **Fecha:** ${new Date().toLocaleString()}\n\n---\n\n`;
    messages.forEach((m) => {
      md += `### ${m.role === 'user' ? 'Estudiante' : 'Sabiondo AI'}:\n${m.content}\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Apuntes_Sabiondo_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Apuntes exportados en Markdown (.md)');
  };

  // Save Settings
  const handleSaveSettings = (newKey, newModel, newTemp, newAutoVoice) => {
    localStorage.setItem('sabiondo_api_key', newKey);
    localStorage.setItem('sabiondo_model', newModel);
    localStorage.setItem('sabiondo_temp', newTemp.toString());
    localStorage.setItem('sabiondo_auto_voice', newAutoVoice.toString());
    setSelectedModel(newModel);
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
        onSelectMode={(m) => {
          setActiveMode(m);
          showToast(`Modo activo: ${ACADEMIC_MODES.find((x) => x.id === m)?.name}`);
        }}
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
        onSpeakText={speakText}
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
          showToast('Notas guardadas', 'success');
        }}
        onSummarizeNotes={() => {
          if (!notes.trim()) {
            showToast('Escribe algo en tus notas primero', 'error');
            return;
          }
          setIsNotesOpen(false);
          setUserInput(`Por favor resume mis siguientes apuntes y genera 3 preguntas de repaso:\n\n"""\n${notes}\n"""`);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        temperature={temperature}
        setTemperature={setTemperature}
        autoVoice={autoVoice}
        setAutoVoice={setAutoVoice}
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
