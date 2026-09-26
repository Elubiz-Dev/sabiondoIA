import { marked } from 'marked';

export function generateStyledExportHTML({ messages, modeName, activeModeIcon }) {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const renderedMessages = messages.map((m) => {
    const isUser = m.role === 'user';
    const parsedHtml = marked.parse(m.content || '');
    return `
      <div class="message-card ${isUser ? 'user-card' : 'ai-card'}">
        <div class="message-header">
          <span class="avatar">${isUser ? '👤' : '🦉'}</span>
          <span class="role-title">${isUser ? 'Estudiante' : 'Sabiondo AI'}</span>
        </div>
        <div class="message-body">
          ${parsedHtml}
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apuntes de Estudio — Sabiondo AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0B0F19;
      --card-bg: #131B2E;
      --card-user: #1E293B;
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
      --primary: #6366F1;
      --primary-gradient: linear-gradient(135deg, #6366F1 0%, #A855F7 100%);
      --border-color: rgba(255, 255, 255, 0.08);
      --accent-green: #10B981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      line-height: 1.65;
      padding: 2.5rem 1.5rem;
    }

    .container {
      max-width: 860px;
      margin: 0 auto;
    }

    .doc-header {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2.5rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }

    .doc-header::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 5px;
      background: var(--primary-gradient);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      font-size: 2.2rem;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .brand-title span {
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .mode-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #A5B4FC;
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .doc-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #FFFFFF;
    }

    .meta-info {
      font-size: 0.88rem;
      color: var(--text-muted);
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .authors-tag {
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .authors-tag strong {
      color: #C7D2FE;
    }

    .print-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.5rem;
      gap: 0.75rem;
    }

    .btn-print {
      background: var(--primary-gradient);
      color: #FFFFFF;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: transform 0.15s ease, opacity 0.15s ease;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
    }

    .btn-print:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .messages-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .message-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }

    .user-card {
      background: rgba(30, 41, 59, 0.7);
      border-left: 4px solid #818CF8;
    }

    .ai-card {
      background: var(--card-bg);
      border-left: 4px solid #10B981;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.85rem;
    }

    .avatar {
      font-size: 1.25rem;
    }

    .role-title {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      color: #E2E8F0;
    }

    .message-body {
      font-size: 0.98rem;
      color: #E2E8F0;
    }

    .message-body p { margin-bottom: 0.75rem; }
    .message-body p:last-child { margin-bottom: 0; }
    .message-body h1, .message-body h2, .message-body h3, .message-body h4 {
      font-family: 'Outfit', sans-serif;
      color: #FFFFFF;
      margin: 1rem 0 0.5rem 0;
    }
    .message-body ul, .message-body ol {
      margin-left: 1.4rem;
      margin-bottom: 0.75rem;
    }
    .message-body li { margin-bottom: 0.35rem; }
    .message-body strong { color: #FFFFFF; }
    .message-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.9rem;
    }
    .message-body th, .message-body td {
      border: 1px solid var(--border-color);
      padding: 0.6rem 0.85rem;
      text-align: left;
    }
    .message-body th {
      background: rgba(99, 102, 241, 0.15);
      color: #FFFFFF;
    }
    .message-body blockquote {
      border-left: 3px solid var(--primary);
      padding-left: 1rem;
      margin: 0.75rem 0;
      color: var(--text-muted);
      font-style: italic;
    }
    .message-body code {
      background: rgba(0, 0, 0, 0.35);
      padding: 0.15rem 0.4rem;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.88rem;
    }
    .message-body pre {
      background: #070A12;
      padding: 1rem;
      border-radius: 12px;
      overflow-x: auto;
      margin: 0.75rem 0;
      border: 1px solid var(--border-color);
    }
    .message-body pre code {
      background: transparent;
      padding: 0;
    }

    .doc-footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    @media print {
      body {
        background: #FFFFFF !important;
        color: #0F172A !important;
        padding: 0 !important;
      }
      .btn-print { display: none !important; }
      .doc-header {
        background: #F8FAFC !important;
        border: 1px solid #E2E8F0 !important;
        box-shadow: none !important;
        color: #0F172A !important;
      }
      .doc-title, .brand-title { color: #0F172A !important; }
      .brand-title span { -webkit-text-fill-color: #4F46E5 !important; }
      .message-card {
        background: #FFFFFF !important;
        border: 1px solid #E2E8F0 !important;
        box-shadow: none !important;
        color: #0F172A !important;
        page-break-inside: avoid;
      }
      .user-card { border-left: 4px solid #6366F1 !important; background: #F8FAFC !important; }
      .ai-card { border-left: 4px solid #10B981 !important; }
      .message-body, .message-body p, .message-body strong { color: #1E293B !important; }
      .message-body th { background: #EEF2F6 !important; color: #0F172A !important; }
      .message-body th, .message-body td { border-color: #CBD5E1 !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-actions">
      <button class="btn-print" onclick="window.print()">
        📄 Imprimir / Guardar como PDF
      </button>
    </div>

    <header class="doc-header">
      <div class="header-top">
        <div class="brand-group">
          <span class="brand-icon">🦉</span>
          <h1 class="brand-title">Sabiondo <span>AI</span></h1>
        </div>
        <div class="mode-badge">
          <span>${activeModeIcon || '🎓'}</span>
          <span>${modeName || 'Tutor General'}</span>
        </div>
      </div>

      <h2 class="doc-title">Guía y Apuntes de Estudio</h2>
      <div class="meta-info">
        <span>📅 ${dateStr}</span>
        <span>💬 ${messages.length} intervenciones</span>
      </div>

      <div class="authors-tag">
        Proyecto desarrollado por: <strong>Daniela Romero & Mayra Barrios</strong> · Sabiondo AI Tutor
      </div>
    </header>

    <main class="messages-container">
      ${renderedMessages}
    </main>

    <footer class="doc-footer">
      Apuntes generados automáticamente por <strong>Sabiondo AI</strong> · Hecho por Daniela Romero y Mayra Barrios
    </footer>
  </div>
</body>
</html>`;
}
