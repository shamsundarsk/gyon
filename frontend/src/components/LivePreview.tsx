import React, { useState, useEffect, useRef } from 'react';
import { CodeFile } from './CodeEditor';
import './LivePreview.css';

interface LivePreviewProps {
  files: CodeFile[];
  activeFile: CodeFile | null;
  className?: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  activeFile,
  className = ''
}) => {
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'auto' | 'manual'>('auto');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (previewMode === 'auto') {
      generatePreview();
    }
  }, [files, activeFile, previewMode]);

  const generatePreview = async () => {
    setIsRefreshing(true);
    
    try {
      const htmlContent = await generateHTMLPreview(files);
      setPreviewContent(htmlContent);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewContent(generateErrorPreview(error instanceof Error ? error.message : String(error)));
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateHTMLPreview = async (projectFiles: CodeFile[]): Promise<string> => {
    // Find HTML file or create one
    let htmlFile = projectFiles.find(f => f.name.endsWith('.html'));
    let cssFiles = projectFiles.filter(f => f.name.endsWith('.css'));
    let jsFiles = projectFiles.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts'));

    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';

    // Combine CSS files
    cssContent = cssFiles.map(f => f.content).join('\n\n');

    // Combine and process JS files
    jsContent = jsFiles.map(f => {
      if (f.name.endsWith('.ts')) {
        // Basic TypeScript to JavaScript conversion for preview
        return basicTypeScriptToJavaScript(f.content);
      }
      return f.content;
    }).join('\n\n');

    if (htmlFile) {
      // Use existing HTML file as base
      htmlContent = htmlFile.content;
      
      // Inject CSS and JS if not already present
      if (cssContent && !htmlContent.includes('<style>') && !htmlContent.includes('<link')) {
        htmlContent = htmlContent.replace(
          '</head>',
          `  <style>\n${cssContent}\n  </style>\n</head>`
        );
      }
      
      if (jsContent && !htmlContent.includes('<script>') && !htmlContent.includes('<script src')) {
        htmlContent = htmlContent.replace(
          '</body>',
          `  <script>\n${jsContent}\n  </script>\n</body>`
        );
      }
    } else {
      // Generate HTML from other files
      htmlContent = generateDefaultHTML(cssContent, jsContent, projectFiles);
    }

    return htmlContent;
  };

  const generateDefaultHTML = (css: string, js: string, projectFiles: CodeFile[]): string => {
    // Try to detect if this is a React project
    const hasReact = projectFiles.some(f => 
      f.content.includes('import React') || 
      f.content.includes('from "react"') ||
      f.content.includes('jsx') ||
      f.name.endsWith('.jsx') ||
      f.name.endsWith('.tsx')
    );

    if (hasReact) {
      return generateReactPreview(css, js);
    }

    // Generate basic HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        ${css}
    </style>
</head>
<body>
    <div class="preview-container">
        <h1>Live Preview</h1>
        <p>Your code is running here. Check the console for any output.</p>
        <div id="app"></div>
        <div id="root"></div>
    </div>
    
    <script>
        // Capture console output and display it
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = function(...args) {
            originalLog.apply(console, args);
            displayConsoleOutput('log', args.join(' '));
        };
        
        console.error = function(...args) {
            originalError.apply(console, args);
            displayConsoleOutput('error', args.join(' '));
        };
        
        function displayConsoleOutput(type, message) {
            const container = document.querySelector('.preview-container');
            const output = document.createElement('div');
            output.style.cssText = \`
                margin: 10px 0;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 13px;
                border-left: 3px solid \${type === 'error' ? '#dc3545' : '#28a745'};
                background: \${type === 'error' ? '#f8d7da' : '#d4edda'};
                color: \${type === 'error' ? '#721c24' : '#155724'};
            \`;
            output.textContent = \`[\${type.toUpperCase()}] \${message}\`;
            container.appendChild(output);
        }
        
        // Your code
        try {
            ${js}
        } catch (error) {
            console.error('Runtime error:', error.message);
        }
    </script>
</body>
</html>`;
  };

  const generateReactPreview = (css: string, js: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
        }
        #root {
            min-height: 100vh;
        }
        ${css}
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel">
        const { useState, useEffect, useRef } = React;
        
        try {
            ${js}
            
            // Try to render if there's a default export or App component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            if (typeof App !== 'undefined') {
                root.render(<App />);
            } else {
                root.render(
                    <div style={{padding: '20px'}}>
                        <h1>React Preview</h1>
                        <p>Define an App component to see your React code in action.</p>
                    </div>
                );
            }
        } catch (error) {
            console.error('React rendering error:', error);
            document.getElementById('root').innerHTML = \`
                <div style="padding: 20px; color: #dc3545; font-family: monospace;">
                    <h2>Error rendering React component:</h2>
                    <pre>\${error.message}</pre>
                </div>
            \`;
        }
    </script>
</body>
</html>`;
  };

  const basicTypeScriptToJavaScript = (tsCode: string): string => {
    // Basic TypeScript to JavaScript conversion for preview
    let jsCode = tsCode;
    
    // Remove type annotations
    jsCode = jsCode.replace(/:\s*[a-zA-Z_$][a-zA-Z0-9_$<>[\]|&]*(\s*\|\s*[a-zA-Z_$][a-zA-Z0-9_$<>[\]|&]*)*\s*(?=[,)=;{])/g, '');
    
    // Remove interface declarations
    jsCode = jsCode.replace(/interface\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\{[^}]*\}/g, '');
    
    // Remove type aliases
    jsCode = jsCode.replace(/type\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;]+;/g, '');
    
    // Remove generic type parameters
    jsCode = jsCode.replace(/<[^>]*>/g, '');
    
    // Remove export type
    jsCode = jsCode.replace(/export\s+type\s+[^;]+;/g, '');
    
    return jsCode;
  };

  const generateErrorPreview = (error: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }
        .error-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #dc3545;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error-title {
            color: #dc3545;
            margin: 0 0 10px 0;
        }
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h2 class="error-title">Preview Generation Error</h2>
        <div class="error-message">${error}</div>
    </div>
</body>
</html>`;
  };

  const handleRefresh = () => {
    generatePreview();
  };

  const handleModeToggle = () => {
    setPreviewMode(prev => prev === 'auto' ? 'manual' : 'auto');
  };

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`live-preview ${className}`}>
      <div className="preview-header">
        <div className="preview-info">
          <span className="preview-icon">👁️</span>
          <span className="preview-title">Live Preview</span>
          <span className="preview-mode">
            ({previewMode})
          </span>
        </div>
        
        <div className="preview-controls">
          <span className="last-update">
            Updated: {formatLastUpdate(lastUpdate)}
          </span>
          
          <button
            className="preview-btn mode-btn"
            onClick={handleModeToggle}
            title={`Switch to ${previewMode === 'auto' ? 'manual' : 'auto'} mode`}
          >
            {previewMode === 'auto' ? '🔄' : '⏸️'}
          </button>
          
          <button
            className="preview-btn refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh preview"
          >
            {isRefreshing ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>
      
      <div className="preview-content">
        {previewContent ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewContent}
            title="Live Preview"
            className="preview-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <div className="preview-placeholder">
            <div className="placeholder-icon">🌐</div>
            <h3>No Preview Available</h3>
            <p>
              Create HTML, CSS, or JavaScript files to see a live preview of your project.
            </p>
            <button className="preview-btn" onClick={handleRefresh}>
              Generate Preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;