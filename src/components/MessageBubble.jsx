import React, { useEffect, useRef } from 'react';
import { Copy, Check, Volume2 } from 'lucide-react';
import { marked } from 'marked';
import katex from 'katex';

export function MessageBubble({ message, onSpeak }) {
  const contentRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (contentRef.current && message.content) {
      try {
        let html = marked.parse(message.content);
        
        // Reemplazo simple para KaTeX $$ ... $$ y $ ... $
        html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
          try {
            return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
          } catch {
            return `$$${math}$$`;
          }
        });

        html = html.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
          try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
          } catch {
            return `$${math}$`;
          }
        });

        contentRef.current.innerHTML = html;
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
