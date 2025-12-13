import React from 'react';
import './OpenEditorButton.css';

interface OpenEditorButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const OpenEditorButton: React.FC<OpenEditorButtonProps> = ({ 
  onClick, 
  disabled = false
}) => {
  return (
    <button
      className="open-editor-button"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="editor-icon">&lt;/&gt;</span>
      Open in Editor
    </button>
  );
};

export default OpenEditorButton;