/**
 * Accessibility Utilities for FarmCon
 *
 * WCAG 2.1 AA Compliant accessibility features including:
 * - Screen reader announcements
 * - Keyboard navigation
 * - Focus management
 * - Color contrast utilities
 * - Skip links
 * - Accessible form validation
 */

export interface AccessibilityConfig {
  announcePageChanges: boolean;
  enableKeyboardShortcuts: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  screenReaderMode: boolean;
}

export const defaultAccessibilityConfig: AccessibilityConfig = {
  announcePageChanges: true,
  enableKeyboardShortcuts: true,
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  screenReaderMode: false,
};

// Screen reader announcer
export class ScreenReaderAnnouncer {
  private liveRegion: HTMLElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveRegion();
    }
  }

  private createLiveRegion() {
    // Create a live region for screen reader announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only'; // Visually hidden but readable by screen readers
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';

    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = '';

    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);
  }

  announcePageChange(pageName: string) {
    this.announce(`Navigated to ${pageName}`, 'polite');
  }

  announceError(error: string) {
    this.announce(`Error: ${error}`, 'assertive');
  }

  announceSuccess(message: string) {
    this.announce(`Success: ${message}`, 'polite');
  }

  announceLoading(isLoading: boolean) {
    if (isLoading) {
      this.announce('Loading, please wait', 'polite');
    } else {
      this.announce('Loading complete', 'polite');
    }
  }
}

// Keyboard navigation manager
export class KeyboardNavigationManager {
  private shortcuts: Map<string, () => void> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupKeyboardListeners();
    }
  }

  private setupKeyboardListeners() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.enabled) return;

      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = this.getKeyCombo(e);
      const handler = this.shortcuts.get(key);

      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }

  private getKeyCombo(e: KeyboardEvent): string {
    const parts: string[] = [];

    // Handle platform-specific modifier keys
    const isMac = this.getPlatform() === 'mac' || this.getPlatform() === 'ios';

    // On Mac, prioritize metaKey (Cmd), on others prioritize ctrlKey
    if (isMac) {
      if (e.metaKey) parts.push('cmd');
      if (e.ctrlKey) parts.push('ctrl'); // Still capture Ctrl on Mac if used
    } else {
      if (e.ctrlKey) parts.push('ctrl');
      if (e.metaKey) parts.push('meta'); // Windows key, etc.
    }

    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');

    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  // Platform detection helper
  getPlatform(): 'mac' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown' {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent;

    // Check for iOS (must be before Mac check)
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return 'ios';
    }

    // Check for Android
    if (/Android/.test(userAgent)) {
      return 'android';
    }

    // Check for Mac
    if (navigator.userAgentData) {
      // Use modern API if available
      if ((navigator.userAgentData as any).platform === 'macOS') return 'mac';
    }

    // Fallback to legacy detection
    if (/Mac|Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
      return 'mac';
    }

    // Check for Windows
    if (/Win/.test(userAgent)) {
      return 'windows';
    }

    // Check for Linux
    if (/Linux/.test(userAgent)) {
      return 'linux';
    }

    return 'unknown';
  }

  // Get platform-specific modifier key name
  getModifierKeyName(): string {
    const platform = this.getPlatform();
    switch (platform) {
      case 'mac':
      case 'ios':
        return 'Cmd';
      case 'windows':
      case 'linux':
      case 'android':
      default:
        return 'Ctrl';
    }
  }

  registerShortcut(keys: string, handler: () => void, description?: string) {
    this.shortcuts.set(keys, handler);
    if (description) {
      console.log(`Keyboard shortcut registered: ${keys} - ${description}`);
    }
  }

  unregisterShortcut(keys: string) {
    this.shortcuts.delete(keys);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  getShortcuts(): Array<{ keys: string; handler: () => void }> {
    return Array.from(this.shortcuts.entries()).map(([keys, handler]) => ({
      keys,
      handler,
    }));
  }
}

// Focus management
export class FocusManager {
  private focusHistory: HTMLElement[] = [];

  trapFocus(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    firstElement.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll(selectors));
  }

  saveFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.focusHistory.push(activeElement);
    }
  }

  restoreFocus() {
    const element = this.focusHistory.pop();
    if (element) {
      element.focus();
    }
  }

  focusElement(selector: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }
}

// Color contrast checker
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  const contrast = getContrastRatio(fgLuminance, bgLuminance);

  // WCAG 2.1 requirements
  const minContrast = level === 'AAA' ? 7 : 4.5;

  return contrast >= minContrast;
}

function getRelativeLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Calculate relative luminance
  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Accessible form helpers
export function getAriaInvalid(hasError: boolean): 'true' | 'false' {
  return hasError ? 'true' : 'false';
}

export function getAriaDescribedBy(id: string, hasError: boolean, hasHelp: boolean): string {
  const ids: string[] = [];
  if (hasError) ids.push(`${id}-error`);
  if (hasHelp) ids.push(`${id}-help`);
  return ids.join(' ');
}

// Accessible labels
export function getAccessibleLabel(
  label: string,
  required?: boolean,
  optional?: boolean
): string {
  if (required) return `${label} (required)`;
  if (optional) return `${label} (optional)`;
  return label;
}

// Skip link utility
export function createSkipLink(targetId: string, label: string = 'Skip to main content') {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-link';
  skipLink.textContent = label;
  skipLink.style.position = 'absolute';
  skipLink.style.top = '-40px';
  skipLink.style.left = '0';
  skipLink.style.background = '#000';
  skipLink.style.color = '#fff';
  skipLink.style.padding = '8px';
  skipLink.style.zIndex = '100';
  skipLink.style.transition = 'top 0.2s';

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  return skipLink;
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(prefers-contrast: more)').matches
  );
}

// Prefers dark mode
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Global instances
export const screenReaderAnnouncer = new ScreenReaderAnnouncer();
export const keyboardNav = new KeyboardNavigationManager();
export const focusManager = new FocusManager();

// Debug function to test platform detection
export function debugAccessibility() {
  if (typeof window === 'undefined') {
    console.log('Running on server (no window object)');
    return;
  }

  const platform = keyboardNav.getPlatform();
  const modifierKey = keyboardNav.getModifierKeyName();

  console.group('🔍 Accessibility Debug Info');
  console.log('Detected Platform:', platform);
  console.log('Modifier Key:', modifierKey);
  console.log('User Agent:', navigator.userAgent);
  console.log('Expected Shortcuts:', `${modifierKey}+H, ${modifierKey}+D, ${modifierKey}+S, ${modifierKey}+M`);

  // Test if user agent detection is working
  const tests = {
    'Is Mac': /Mac|Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent),
    'Is Windows': /Win/.test(navigator.userAgent),
    'Is Linux': /Linux/.test(navigator.userAgent),
    'Is iOS': /iPad|iPhone|iPod/.test(navigator.userAgent),
    'Is Android': /Android/.test(navigator.userAgent),
  };

  console.table(tests);

  console.log('\n📋 To test keyboard shortcuts:');
  console.log(`Press ${modifierKey}+H to go to home`);
  console.log(`Press ${modifierKey}+/ to see all shortcuts`);

  console.groupEnd();

  return {
    platform,
    modifierKey,
    userAgent: navigator.userAgent,
    tests,
  };
}
