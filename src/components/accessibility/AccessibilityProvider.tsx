'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  AccessibilityConfig,
  defaultAccessibilityConfig,
  screenReaderAnnouncer,
  keyboardNav,
  prefersReducedMotion,
  prefersHighContrast,
} from '@/lib/accessibility';

interface AccessibilityContextType {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announcePageChange: (pageName: string) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [config, setConfig] = useState<AccessibilityConfig>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('farmcon-accessibility-config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultAccessibilityConfig;
        }
      }
    }
    return defaultAccessibilityConfig;
  });

  // Detect user preferences
  useEffect(() => {
    const reducedMotion = prefersReducedMotion();
    const highContrast = prefersHighContrast();

    if (reducedMotion || highContrast) {
      setConfig(prev => ({
        ...prev,
        reducedMotion: reducedMotion || prev.reducedMotion,
        highContrast: highContrast || prev.highContrast,
      }));
    }
  }, []);

  // Apply config to document
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    root.style.setProperty('--base-font-size', getFontSize(config.fontSize));

    // High contrast mode
    if (config.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (config.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Screen reader mode
    if (config.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }

    // Save to localStorage
    localStorage.setItem('farmcon-accessibility-config', JSON.stringify(config));
  }, [config]);

  // Setup keyboard shortcuts
  useEffect(() => {
    if (config.enableKeyboardShortcuts) {
      const platform = keyboardNav.getPlatform();
      const isMac = platform === 'mac' || platform === 'ios';

      // Register shortcuts for both Cmd (Mac) and Alt (Windows/Linux)
      const registerCrossPlatformShortcut = (key: string, handler: () => void, description: string) => {
        if (isMac) {
          // Mac: Cmd+key
          keyboardNav.registerShortcut(`cmd+${key}`, handler, description);
        } else {
          // Windows/Linux: Alt+key
          keyboardNav.registerShortcut(`alt+${key}`, handler, description);
        }
      };

      // Home page
      registerCrossPlatformShortcut('h', () => {
        window.location.href = '/';
      }, 'Go to home page');

      // Dashboard
      registerCrossPlatformShortcut('d', () => {
        window.location.href = '/dashboard';
      }, 'Go to dashboard');

      // Search
      registerCrossPlatformShortcut('s', () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 'Focus search');

      // Help
      registerCrossPlatformShortcut('/', () => {
        const modifierKey = keyboardNav.getModifierKeyName();
        screenReaderAnnouncer.announce(
          `Keyboard shortcuts: ${modifierKey}+H for home, ${modifierKey}+D for dashboard, ${modifierKey}+S for search, ${modifierKey}+M for menu`,
          'polite'
        );
      }, 'Show keyboard shortcuts');

      // Skip to main content
      registerCrossPlatformShortcut('m', () => {
        const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
        if (mainContent) {
          (mainContent as HTMLElement).focus();
          mainContent.scrollIntoView({ behavior: config.reducedMotion ? 'auto' : 'smooth' });
        }
      }, 'Skip to main content');

      // Additional mobile-friendly shortcuts
      if (platform === 'android' || platform === 'ios') {
        // Volume keys can be used for navigation on mobile
        document.addEventListener('keydown', (e) => {
          if (e.key === 'VolumeUp') {
            e.preventDefault();
            window.scrollBy({ top: -200, behavior: config.reducedMotion ? 'auto' : 'smooth' });
          } else if (e.key === 'VolumeDown') {
            e.preventDefault();
            window.scrollBy({ top: 200, behavior: config.reducedMotion ? 'auto' : 'smooth' });
          }
        });
      }
    }

    return () => {
      keyboardNav.setEnabled(false);
    };
  }, [config.enableKeyboardShortcuts, config.reducedMotion]);

  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    screenReaderAnnouncer.announce(message, priority);
  };

  const announcePageChange = (pageName: string) => {
    if (config.announcePageChanges) {
      screenReaderAnnouncer.announcePageChange(pageName);
    }
  };

  const announceError = (error: string) => {
    screenReaderAnnouncer.announceError(error);
  };

  const announceSuccess = (message: string) => {
    screenReaderAnnouncer.announceSuccess(message);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        config,
        updateConfig,
        announce,
        announcePageChange,
        announceError,
        announceSuccess,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

function getFontSize(size: AccessibilityConfig['fontSize']): string {
  const sizes = {
    small: '14px',
    medium: '16px',
    large: '18px',
    'x-large': '20px',
  };
  return sizes[size];
}
