/**
 * User Preferences Service
 * Manages user settings and preferences for the AI Code Editor
 * Validates: Requirements 1.1
 */

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  aiAssistanceEnabled: boolean;
  codeCompletionEnabled: boolean;
  errorHighlighting: boolean;
  formatOnSave: boolean;
  language: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  autoSave: true,
  autoSaveDelay: 1000,
  aiAssistanceEnabled: true,
  codeCompletionEnabled: true,
  errorHighlighting: true,
  formatOnSave: true,
  language: 'en',
};

class UserPreferencesService {
  private static readonly STORAGE_KEY = 'ai-code-editor-preferences';
  private preferences: UserPreferences;
  private listeners: ((preferences: UserPreferences) => void)[] = [];

  constructor() {
    this.preferences = this.loadPreferences();
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(UserPreferencesService.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(
        UserPreferencesService.STORAGE_KEY,
        JSON.stringify(this.preferences)
      );
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Update a specific preference
   */
  updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    this.preferences[key] = value;
    this.savePreferences();
  }

  /**
   * Update multiple preferences at once
   */
  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  /**
   * Reset preferences to defaults
   */
  resetPreferences(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
  }

  /**
   * Subscribe to preference changes
   */
  subscribe(listener: (preferences: UserPreferences) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of preference changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getPreferences());
      } catch (error) {
        console.error('Error in preference listener:', error);
      }
    });
  }

  /**
   * Export preferences as JSON
   */
  exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  importPreferences(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      if (typeof imported === 'object' && imported !== null) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...imported };
        this.savePreferences();
        return true;
      }
    } catch (error) {
      console.error('Failed to import preferences:', error);
    }
    return false;
  }

  /**
   * Get theme preference with system detection
   */
  getEffectiveTheme(): 'light' | 'dark' {
    if (this.preferences.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.preferences.theme;
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();