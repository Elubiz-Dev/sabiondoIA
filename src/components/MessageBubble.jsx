import React, { useEffect, useRef } from 'react';
import { Copy, Check, Volume2 } from 'lucide-react';
import { marked } from 'marked';
import katex from 'katex';

// Configurar marked para saltos de línea suaves
marked.setOptions({
  gfm: true,
  breaks: true
});

function formatAcademicContent(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return '';

  let text = rawContent;

  // 1. Limpiar símbolos y comandos LaTeX crudos fuera de contexto matemático
  // Convertir grados como 45^\circ o 45\circ a 45°
  text = text.replace(/(\d+)\s*\^?\\circ/g, '$1°');

  // Convertir delimitadores de bloque \[ ... \] o [ ... con comandos math ]
  text = text.replace(/\\?\[\s*([\s\S]*?)\s*\\?\]/g, (match, formula) => {
    if (/\\(frac|sqrt|sin|cos|tan|arcsin|arccos|arctan|approx|times|cdot|Longrightarrow|rightarrow|sum|int|lim|alpha|beta|theta|circ|pm|neq|leq|geq|log|ln)|[\^_]/.test(formula)) {
      return `\n\n$$${formula.trim()}$$\n\n`;
    }
    return match;
  });

  // Convertir delimitadores inline \( ... \) o ( ... con comandos math )
  text = text.replace(/\\?\(\s*([\s\S]*?)\s*\\?\)/g, (match, formula) => {
    if (/\\(frac|sqrt|sin|cos|tan|circ|alpha|beta|theta|approx|cdot|times|pm|neq|leq|geq)|[\^_]/.test(formula)) {
      return ` $${formula.trim()}$ `;
    }
    return match;
  });

  // 2. Pre-renderizar KaTeX antes de Marked para no romper caracteres especiales (_, *, \, <, >)
  const mathMap = [];

  // Bloques de ecuaciones ($$ ... $$)
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const idx = mathMap.length;
    let rendered;
    try {
      rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      rendered = `<div class="katex-error">${math}</div>`;
    }
    mathMap.push(rendered);
    return `%%KATEX_BLOCK_${idx}%%`;
  });

  // Fórmulas en línea ($ ... $)
  text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    const idx = mathMap.length;
    let rendered;
    try {
      rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      rendered = `<span class="katex-error">${math}</span>`;
    }
    mathMap.push(rendered);
    return `%%KATEX_INLINE_${idx}%%`;
  });

  // 3. Parsear Markdown
  let html = '';
  try {
    html = marked.parse(text);
  } catch {
    html = text;
  }

  // 4. Restaurar fórmulas renderizadas por KaTeX
  html = html.replace(/%%KATEX_(?:BLOCK|INLINE)_(\d+)%%/g, (_, idx) => mathMap[Number(idx)] || '');

  return html;
}

export function MessageBubble({ message, onSpeak }) {
  const contentRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (contentRef.current && message.content) {
      try {
        contentRef.current.innerHTML = formatAcademicContent(message.content);
      } catch (err) {
        contentRef.current.innerText = message.content;
      }
    }
  }, [message.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🦉'}
      </div>
      <div className="message-content-wrapper">
        <div className="message-bubble" ref={contentRef}>
          {message.content}
        </div>
        {!isUser && (
          <div className="message-actions">
            <button className="msg-action-btn" onClick={handleCopy} title="Copiar">
              {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button className="msg-action-btn" onClick={() => onSpeak(message.content)} title="Escuchar">
              <Volume2 size={14} />
              <span>Escuchar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
