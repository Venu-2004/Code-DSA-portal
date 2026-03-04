import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ 
  value, 
  onChange, 
  language = 'python', 
  height = '400px',
  readOnly = false,
  blockClipboard = true,
  onClipboardBlocked = null
}) {
  const [editorTheme, setEditorTheme] = useState('vs-dark');

  useEffect(() => {
    setEditorTheme('vs-dark');
  }, []);

  const handleEditorChange = (value) => {
    if (onChange) {
      onChange(value);
    }
  };

  const getLanguageId = (lang) => {
    const languageMap = {
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'javascript': 'javascript',
      'c': 'c'
    };
    return languageMap[lang.toLowerCase()] || 'python';
  };

  const preventClipboardAction = (event, actionLabel) => {
    if (!blockClipboard) {
      return;
    }
    event.preventDefault();
    if (onClipboardBlocked) {
      onClipboardBlocked(`${actionLabel} is disabled in this editor.`);
    }
  };

  const handleKeyDown = (event) => {
    if (!blockClipboard) {
      return;
    }
    const key = event.key.toLowerCase();
    const isModifierPressed = event.ctrlKey || event.metaKey;
    if (!isModifierPressed) {
      return;
    }
    if (key === 'c' || key === 'x' || key === 'v') {
      event.preventDefault();
      if (onClipboardBlocked) {
        onClipboardBlocked('Copy, cut, and paste are disabled in this editor.');
      }
    }
  };

  return (
    <div
      className="border border-slate-700/75 rounded-lg overflow-hidden"
      onPaste={(e) => preventClipboardAction(e, 'Paste')}
      onCopy={(e) => preventClipboardAction(e, 'Copy')}
      onCut={(e) => preventClipboardAction(e, 'Cut')}
      onContextMenu={(e) => preventClipboardAction(e, 'Context menu')}
      onKeyDown={handleKeyDown}
    >
      <Editor
        height={height}
        language={getLanguageId(language)}
        value={value}
        onChange={handleEditorChange}
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
          automaticLayout: true,
          readOnly: readOnly,
          wordWrap: 'on',
          contextmenu: !blockClipboard,
          copyWithSyntaxHighlighting: false,
        }}
      />
    </div>
  );
}

export default CodeEditor;
