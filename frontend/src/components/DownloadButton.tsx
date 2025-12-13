import React from 'react';
import { DownloadIcon, CheckIcon } from './Icons';
import './DownloadButton.css';

interface DownloadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isDownloading?: boolean;
  downloadSuccess?: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  onClick, 
  disabled = false,
  isDownloading = false,
  downloadSuccess = false
}) => {
  const getButtonContent = () => {
    if (isDownloading) {
      return (
        <>
          <div className="loading-spinner-btn" />
          Downloading...
        </>
      );
    }
    
    if (downloadSuccess) {
      return (
        <>
          <CheckIcon size={20} />
          Downloaded!
        </>
      );
    }
    
    return (
      <>
        <DownloadIcon size={20} />
        Download Project
      </>
    );
  };

  return (
    <button
      className={`download-button ${downloadSuccess ? 'success' : ''}`}
      onClick={onClick}
      disabled={disabled || isDownloading}
    >
      {getButtonContent()}
    </button>
  );
};

export default DownloadButton;