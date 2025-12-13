/**
 * User Preferences Panel Component
 * Provides comprehensive settings interface for user preferences
 * Validates: Requirements 1.1
 */

import React, { useState, useEffect } from 'react';
import { userPreferencesService, UserPreferences } from '../services/UserPreferencesService';
import { ThemeToggle } from './ThemeToggle';
import './UserPreferencesPanel.css';

interface UserPreferencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPreferencesPanel: React.FC<UserPreferencesPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(
    userPreferencesService.getPreferences()
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'ai' | 'general'>('editor');

  useEffect(() => {
    const unsubscribe = userPreferencesService.subscribe(setPreferences);
    return unsubscribe;
  }, []);

  const handlePreferenceChange = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    userPreferencesService.updatePreference(key, value);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all preferences to defaults?')) {
      userPreferencesService.resetPreferences();
    }
  };

  const handleExport = () => {
    const json = userPreferencesService.exportPreferences();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-code-editor-preferences.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (userPreferencesService.importPreferences(content)) {
          alert('Preferences imported successfully!');
        } else {
          alert('Failed to import preferences. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="preferences-overlay">
      <div className="preferences-panel">
        <div className="preferences-header">
          <h2>User Preferences</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close preferences">
            ✕
          </button>
        </div>

        <div className="preferences-tabs">
          <button
            className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button
            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Features
          </button>
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
        </div>

        <div className="preferences-content">
          {activeTab === 'editor' && (
            <div className="preference-section">
              <h3>Editor Settings</h3>
              
              <div className="preference-group">
                <label htmlFor="fontSize">Font Size</label>
                <input
                  id="fontSize"
                  type="number"
                  min="10"
                  max="24"
                  value={preferences.fontSize}
                  onChange={(e) => handlePreferenceChange('fontSize', parseInt(e.target.value))}
                />
              </div>

              <div className="preference-group">
                <label htmlFor="fontFamily">Font Family</label>
                <select
                  id="fontFamily"
                  value={preferences.fontFamily}
                  onChange={(e) => handlePreferenceChange('fontFamily', e.target.value)}
                >
                  <option value="Monaco, Menlo, 'Ubuntu Mono', monospace">Monaco</option>
                  <option value="'Fira Code', monospace">Fira Code</option>
                  <option value="'Source Code Pro', monospace">Source Code Pro</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                  <option value="Consolas, monospace">Consolas</option>
                </select>
              </div>

              <div className="preference-group">
                <label htmlFor="tabSize">Tab Size</label>
                <select
                  id="tabSize"
                  value={preferences.tabSize}
                  onChange={(e) => handlePreferenceChange('tabSize', parseInt(e.target.value))}
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>

              <div className="preference-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.wordWrap}
                    onChange={(e) => handlePreferenceChange('wordWrap', e.target.checked)}
                  />
                  Word Wrap
                </label>
              </div>

              <div className="preference-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.minimap}
                    onChange={(e) => handlePreferenceChange('minimap', e.target.checked)}
                  />
                  Show Minimap
                </label>
              </div>

              <div className="preference-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.lineNumbers}
                    onChange={(e) => handlePreferenceChange('lineNumbers', e.target.checked)}
                  />
                  Show Line Numbers
                </label>
              </div>

              <div className="preference-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.formatOnSave}
                    onChange={(e) => handlePreferenceChange('formatOnSave', e.target.checked)}
                  />
                  Format on Save
                </label>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="preference-section">
              <h3>AI Features</h3>
              
              <div className="preference-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.aiAssistanceEnabled}
                    onChange={(e) => handlePreferenceChange('aiAssistanceEnabled', e.target.checked)}
                  />
                  Enable AI Assistance
                </label>
              </div>

              <div className="preference-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.codeCompletionEnabled}
                    onChange={(e) => handlePreferenceChange('codeCompletionEnabled', e.target.checked)}
                  />
                  Enable Code Completion
                </label>
              </div>

              <div className="preference-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.errorHighlighting}
                    onChange={(e) => handlePreferenceChange('errorHighlighting', e.target.checked)}
                  />
                  Enable Error Highlighting
                </label>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="preference-section">
              <h3>General Settings</h3>
              
              <div className="preference-group">
                <label>Theme</label>
                <ThemeToggle />
              </div>

              <div className="preference-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.autoSave}
                    onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                  />
                  Auto Save
                </label>
              </div>

              {preferences.autoSave && (
                <div className="preference-group">
                  <label htmlFor="autoSaveDelay">Auto Save Delay (ms)</label>
                  <input
                    id="autoSaveDelay"
                    type="number"
                    min="500"
                    max="5000"
                    step="100"
                    value={preferences.autoSaveDelay}
                    onChange={(e) => handlePreferenceChange('autoSaveDelay', parseInt(e.target.value))}
                  />
                </div>
              )}

              <div className="preference-group">
                <label htmlFor="language">Language</label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="preferences-actions">
          <div className="action-group">
            <button className="btn-secondary" onClick={handleReset}>
              Reset to Defaults
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              Export Settings
            </button>
            <label className="btn-secondary file-input-label">
              Import Settings
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};