/**
 * Accessibility Service
 * Provides keyboard navigation, screen reader support, and accessibility features
 */

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusIndicator: 'default' | 'enhanced' | 'high-contrast';
}

class AccessibilityService {
  private static instance: AccessibilityService;
  private shortcuts = new Map<string, KeyboardShortcut>();
  private focusHistory: HTMLElement[] = [];
  private currentFocusIndex = -1;
  private settings: AccessibilitySettings = {
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    fontSize: 'medium',
    focusIndicator: 'default'
  };

  private constructor() {
    this.initializeAccessibility();
    this.loadSettings();
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  /**
   * Initialize accessibility features
   */
  private initializeAccessibility(): void {
    // Listen for keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Listen for focus changes
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    
    // Check for reduced motion preference (with fallback for test environments)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.settings.reducedMotion = prefersReducedMotion.matches;
      
      // Check for high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      this.settings.highContrast = prefersHighContrast.matches;
    }
    
    // Apply initial settings
    this.applySettings();
    
    // Register default shortcuts
    this.registerDefaultShortcuts();
  }

  /**
   * Register a keyboard shortcut
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    // Normalize category to handle whitespace strings
    const normalizedShortcut = {
      ...shortcut,
      category: shortcut.category?.trim() || 'default'
    };
    const key = this.getShortcutKey(normalizedShortcut);
    this.shortcuts.set(key, normalizedShortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(key: string, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false): void {
    const shortcutKey = this.createShortcutKey(key, ctrlKey, shiftKey, altKey, metaKey);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Get all registered shortcuts grouped by category
   */
  getShortcuts(): Record<string, KeyboardShortcut[]> {
    const grouped = Object.create(null); // Create object without prototype
    
    this.shortcuts.forEach(shortcut => {
      // Validate category is a non-empty string
      const category = (shortcut.category && shortcut.category.trim()) || 'default';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(shortcut);
    });
    
    return grouped;
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const shortcutKey = this.createShortcutKey(
      event.key,
      event.ctrlKey,
      event.shiftKey,
      event.altKey,
      event.metaKey
    );
    
    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
      this.announceAction(shortcut.description);
    }
    
    // Handle tab navigation
    if (event.key === 'Tab' && this.settings.keyboardNavigation) {
      this.handleTabNavigation(event);
    }
    
    // Handle escape key for modal/dialog closing
    if (event.key === 'Escape') {
      this.handleEscape();
    }
  }

  /**
   * Handle focus changes
   */
  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (target && this.settings.keyboardNavigation) {
      this.addToFocusHistory(target);
      this.announceFocus(target);
    }
  }

  /**
   * Handle tab navigation
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (event.shiftKey) {
      // Shift+Tab - go to previous element
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      focusableElements[prevIndex]?.focus();
    } else {
      // Tab - go to next element
      const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      focusableElements[nextIndex]?.focus();
    }
  }

  /**
   * Handle escape key
   */
  private handleEscape(): void {
    // Close any open modals or dialogs
    const modals = document.querySelectorAll('[role="dialog"], .modal, .popup');
    const openModal = Array.from(modals).find(modal => 
      (modal as HTMLElement).style.display !== 'none' && 
      !modal.hasAttribute('hidden')
    );
    
    if (openModal) {
      const closeButton = openModal.querySelector('[data-close], .close-button, .cancel-button');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
    }
  }

  /**
   * Get all focusable elements
   */
  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Add element to focus history
   */
  private addToFocusHistory(element: HTMLElement): void {
    this.focusHistory.push(element);
    this.currentFocusIndex = this.focusHistory.length - 1;
    
    // Limit history size
    if (this.focusHistory.length > 50) {
      this.focusHistory.shift();
      this.currentFocusIndex--;
    }
  }

  /**
   * Go back in focus history
   */
  goBackInFocus(): void {
    if (this.currentFocusIndex > 0) {
      this.currentFocusIndex--;
      const element = this.focusHistory[this.currentFocusIndex];
      if (element && document.contains(element)) {
        element.focus();
      }
    }
  }

  /**
   * Go forward in focus history
   */
  goForwardInFocus(): void {
    if (this.currentFocusIndex < this.focusHistory.length - 1) {
      this.currentFocusIndex++;
      const element = this.focusHistory[this.currentFocusIndex];
      if (element && document.contains(element)) {
        element.focus();
      }
    }
  }

  /**
   * Announce action to screen readers
   */
  private announceAction(message: string): void {
    if (this.settings.screenReaderMode) {
      this.announce(message);
    }
  }

  /**
   * Announce focus change to screen readers
   */
  private announceFocus(element: HTMLElement): void {
    if (!this.settings.screenReaderMode) return;
    
    const label = this.getElementLabel(element);
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    
    if (label) {
      this.announce(`${label}, ${role}`);
    }
  }

  /**
   * Get accessible label for element
   */
  private getElementLabel(element: HTMLElement): string {
    // Try aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    // Try aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }
    
    // Try associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || '';
    }
    
    // Try placeholder or title
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;
    
    const title = element.getAttribute('title');
    if (title) return title;
    
    // Try text content
    return element.textContent || '';
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    
    document.body.appendChild(announcer);
    announcer.textContent = message;
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Update accessibility settings
   */
  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
    this.saveSettings();
  }

  /**
   * Get current accessibility settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Apply accessibility settings to the document
   */
  private applySettings(): void {
    const root = document.documentElement;
    
    // High contrast
    root.classList.toggle('high-contrast', this.settings.highContrast);
    
    // Reduced motion
    root.classList.toggle('reduced-motion', this.settings.reducedMotion);
    
    // Screen reader mode
    root.classList.toggle('screen-reader-mode', this.settings.screenReaderMode);
    
    // Font size
    root.setAttribute('data-font-size', this.settings.fontSize);
    
    // Focus indicator
    root.setAttribute('data-focus-indicator', this.settings.focusIndicator);
    
    // Keyboard navigation
    if (this.settings.keyboardNavigation) {
      root.setAttribute('data-keyboard-nav', 'true');
    } else {
      root.removeAttribute('data-keyboard-nav');
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
    }
  }

  /**
   * Register default keyboard shortcuts
   */
  private registerDefaultShortcuts(): void {
    // Navigation shortcuts
    this.registerShortcut({
      key: 'F6',
      action: () => this.focusNextRegion(),
      description: 'Move to next region',
      category: 'Navigation'
    });
    
    this.registerShortcut({
      key: 'F6',
      shiftKey: true,
      action: () => this.focusPreviousRegion(),
      description: 'Move to previous region',
      category: 'Navigation'
    });
    
    // Accessibility shortcuts
    this.registerShortcut({
      key: 'F1',
      action: () => this.showKeyboardShortcuts(),
      description: 'Show keyboard shortcuts',
      category: 'Help'
    });
    
    this.registerShortcut({
      key: 'F2',
      action: () => this.toggleScreenReaderMode(),
      description: 'Toggle screen reader mode',
      category: 'Accessibility'
    });
    
    // Focus navigation
    this.registerShortcut({
      key: 'Alt+Left',
      altKey: true,
      action: () => this.goBackInFocus(),
      description: 'Go back in focus history',
      category: 'Navigation'
    });
    
    this.registerShortcut({
      key: 'Alt+Right',
      altKey: true,
      action: () => this.goForwardInFocus(),
      description: 'Go forward in focus history',
      category: 'Navigation'
    });
  }

  /**
   * Focus next region (main content areas)
   */
  private focusNextRegion(): void {
    const regions = document.querySelectorAll('[role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]');
    const currentRegion = document.activeElement?.closest('[role]');
    const currentIndex = Array.from(regions).indexOf(currentRegion as Element);
    const nextIndex = (currentIndex + 1) % regions.length;
    
    const nextRegion = regions[nextIndex] as HTMLElement;
    if (nextRegion) {
      nextRegion.focus();
      this.announce(`Moved to ${nextRegion.getAttribute('role')} region`);
    }
  }

  /**
   * Focus previous region
   */
  private focusPreviousRegion(): void {
    const regions = document.querySelectorAll('[role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]');
    const currentRegion = document.activeElement?.closest('[role]');
    const currentIndex = Array.from(regions).indexOf(currentRegion as Element);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : regions.length - 1;
    
    const prevRegion = regions[prevIndex] as HTMLElement;
    if (prevRegion) {
      prevRegion.focus();
      this.announce(`Moved to ${prevRegion.getAttribute('role')} region`);
    }
  }

  /**
   * Show keyboard shortcuts help
   */
  private showKeyboardShortcuts(): void {
    // This would trigger a modal or help panel showing all shortcuts
    console.log('Keyboard shortcuts:', this.getShortcuts());
    this.announce('Keyboard shortcuts help opened');
  }

  /**
   * Toggle screen reader mode
   */
  private toggleScreenReaderMode(): void {
    this.updateSettings({ screenReaderMode: !this.settings.screenReaderMode });
    this.announce(`Screen reader mode ${this.settings.screenReaderMode ? 'enabled' : 'disabled'}`);
  }

  /**
   * Create shortcut key string
   */
  private createShortcutKey(key: string, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false): string {
    const modifiers = [];
    if (ctrlKey) modifiers.push('Ctrl');
    if (shiftKey) modifiers.push('Shift');
    if (altKey) modifiers.push('Alt');
    if (metaKey) modifiers.push('Meta');
    
    return [...modifiers, key].join('+');
  }

  /**
   * Get shortcut key from shortcut object
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    return this.createShortcutKey(
      shortcut.key,
      shortcut.ctrlKey,
      shortcut.shiftKey,
      shortcut.altKey,
      shortcut.metaKey
    );
  }

  /**
   * Add ARIA attributes to enhance accessibility
   */
  enhanceElement(element: HTMLElement, options: {
    role?: string;
    label?: string;
    description?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
  }): void {
    if (options.role) {
      element.setAttribute('role', options.role);
    }
    
    if (options.label) {
      element.setAttribute('aria-label', options.label);
    }
    
    if (options.description) {
      element.setAttribute('aria-describedby', options.description);
    }
    
    if (options.expanded !== undefined) {
      element.setAttribute('aria-expanded', options.expanded.toString());
    }
    
    if (options.selected !== undefined) {
      element.setAttribute('aria-selected', options.selected.toString());
    }
    
    if (options.disabled !== undefined) {
      element.setAttribute('aria-disabled', options.disabled.toString());
    }
  }
}

export const accessibilityService = AccessibilityService.getInstance();