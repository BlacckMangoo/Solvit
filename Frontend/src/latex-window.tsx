import React, { useEffect, useRef, useState } from 'react';
import interact from 'interactjs';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import './LatexOutputWindow.css';

interface LatexOutputWindowProps {
  latexError: string | null;
  cleanedLatex: string;
  onClose?: () => void;
}

const LatexOutputWindow: React.FC<LatexOutputWindowProps> = ({ latexError, cleanedLatex, onClose }) => {
  const latexWindowRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const windowElement = latexWindowRef.current;
    if (!windowElement) return;

    const interactInstance = interact(windowElement)
      .draggable({
        inertia: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: true,
          }),
        ],
        listeners: {
          move(event) {
            const target = event.target as HTMLElement;
            const x = (parseFloat(target.getAttribute('data-x') || '0') || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y') || '0') || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', y.toString());
          },
        },
      })
      .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
          move(event) {
            const target = event.target as HTMLElement;
            let x = parseFloat(target.getAttribute('data-x') || '0') || 0;
            let y = parseFloat(target.getAttribute('data-y') || '0') || 0;

            // Update size
            target.style.width = `${event.rect.width}px`;
            target.style.height = `${event.rect.height}px`;

            // Adjust position for resizing from top/left edges using deltaRect
            if (event.deltaRect) {
              x += event.deltaRect.left;
              y += event.deltaRect.top;
            }

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', y.toString());
          },
        },
        modifiers: [
          interact.modifiers.restrictEdges({
            outer: 'parent',
          }),
          interact.modifiers.restrictSize({
            min: { width: 200, height: isCollapsed ? 40 : 100 },
            max: { width: 800, height: window.innerHeight * 0.8 },
          }),
        ],
        inertia: true,
      });

    return () => {
      interactInstance.unset();
    };
  }, [isCollapsed]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedLatex);
    const copyBtn = document.querySelector('.copy-btn') as HTMLButtonElement | null;
    if (copyBtn) {
      const originalText = copyBtn.textContent || 'Copy';
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 1500);
    }
  };

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      ref={latexWindowRef}
      className={`latex-output-window ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        transform: 'translate(-50%, -50%)',
        left: '50%',
        top: '50%',
      }}
    >
      <div className="latex-header">
        <h3>LaTeX Output</h3>
        <div className="window-controls">
          <button 
            className="window-control-btn collapse-btn" 
            onClick={handleCollapse}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
              </svg>
            )}
          </button>
          <button 
            className="window-control-btn close-btn" 
            onClick={handleClose}
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="latex-content">
          {latexError ? (
            <div className="error-container">
              <p className="error-message">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  className="error-icon"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                </svg>
                {latexError}
              </p>
            </div>
          ) : (
            <>
              <div className="latex-preview">
                <BlockMath math={cleanedLatex} />
              </div>
              <div className="latex-code-container">
                <pre className="latex-code">{cleanedLatex}</pre>
                <button
                  className="copy-btn"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                  </svg>
                  Copy
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LatexOutputWindow;