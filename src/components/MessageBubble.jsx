import React, { useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { marked } from 'marked';
import katex from 'katex';

marked.setOptions({
  gfm: true,
  breaks: true
});

function formatAcademicContent(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return '';

  let text = rawContent;

  // 1. Normalizar delimitadores de bloque LaTeX \[ ... \] a $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `\n\n$$${formula.trim()}$$\n\n`);

  // 2. Normalizar delimitadores inline LaTeX \( ... \) a $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => ` $${formula.trim()}$ `);

  // 3. Normalizar corchetes con comandos matemáticos [ \frac ... ] o [ \sin ... ] a $$ ... $$
  text = text.replace(/\[\s*(\\?(?:frac|sqrt|sin|cos|tan|arcsin|arccos|arctan|approx|times|cdot|Longrightarrow|rightarrow|sum|int|lim|alpha|beta|theta|gamma|delta|pi|lambda|sigma|mu|omega|phi|psi|circ|pm|neq|leq|geq|log|ln)[\s\S]*?)\s*\]/g, (_, formula) => `\n\n$$${formula.trim()}$$\n\n`);

  // 4. Convertir grados como 45^\circ o 45\circ a 45°
  text = text.replace(/(\d+)\s*\^?\\circ/g, '$1°');

  // 5. Detectar símbolos matemáticos con barra invertida huérfanos (\theta, \alpha, \pi, etc.)
  text = text.replace(/(?<!\$)\\(theta|alpha|beta|gamma|delta|pi|lambda|sigma|mu|omega|phi|psi|approx|times|pm|cdot|neq|leq|geq)(?!\$)/g, (_, sym) => ` $\\${sym}$ `);

  // 6. Pre-renderizar bloques KaTeX ($$ ... $$) antes de procesar Markdown
  const mathMap = [];
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const idx = mathMap.length;
    let rendered;
    try {
      rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      rendered = `<div class="katex-rendered-block">${math}</div>`;
    }
    mathMap.push(rendered);
    return `%%KATEX_BLOCK_${idx}%%`;
  });

  // 7. Pre-renderizar fórmulas en línea ($ ... $)
  text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    const idx = mathMap.length;
    let rendered;
    try {
      rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      rendered = `<span class="katex-rendered-inline">${math}</span>`;
    }
    mathMap.push(rendered);
    return `%%KATEX_INLINE_${idx}%%`;
  });

  // 8. Parsear Markdown
  let html = '';
  try {
    html = marked.parse(text);
  } catch {
    html = text;
  }

  // 9. Restaurar fórmulas matemáticas renderizadas por KaTeX
  html = html.replace(/%%KATEX_(?:BLOCK|INLINE)_(\d+)%%/g, (_, idx) => mathMap[Number(idx)] || '');

  return html;
}

export function MessageBubble({ message }) {
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
          </div>
        )}
      </div>
    </div>
  );
}
