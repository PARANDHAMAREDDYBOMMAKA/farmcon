'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { keyboardNav } from '@/lib/accessibility';
import {
  Settings,
  Type,
  Eye,
  Keyboard,
  Volume2,
  Moon,
  Contrast,
  Zap,
} from 'lucide-react';

export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown'>('unknown');
  const { config, updateConfig, announce } = useAccessibility();

  useEffect(() => {
    setPlatform(keyboardNav.getPlatform());
  }, []);

  const togglePanel = () => {
    setIsOpen(!isOpen);
    announce(isOpen ? 'Accessibility settings closed' : 'Accessibility settings opened', 'polite');
  };

  const handleChange = (key: keyof typeof config, value: any) => {
    updateConfig({ [key]: value });
    announce(`${key} changed to ${value}`, 'polite');
  };

  return (
    <>
      {/* Floating Accessibility Button */}
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
        aria-label="Toggle accessibility settings"
        aria-expanded={isOpen}
      >
        <Settings className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={togglePanel}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            role="dialog"
            aria-labelledby="accessibility-panel-title"
            aria-modal="true"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  id="accessibility-panel-title"
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                >
                  Accessibility Settings
                </h2>
                <button
                  onClick={togglePanel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close accessibility settings"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                {/* Font Size */}
                <div>
                  <label
                    htmlFor="font-size"
                    className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Type className="w-5 h-5 mr-2" aria-hidden="true" />
                    Font Size
                  </label>
                  <select
                    id="font-size"
                    value={config.fontSize}
                    onChange={(e) => handleChange('fontSize', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    aria-describedby="font-size-help"
                  >
                    <option value="small">Small (14px)</option>
                    <option value="medium">Medium (16px)</option>
                    <option value="large">Large (18px)</option>
                    <option value="x-large">Extra Large (20px)</option>
                  </select>
                  <p id="font-size-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Adjust the base font size for better readability
                  </p>
                </div>

                {/* High Contrast */}
                <div>
                  <label className="flex items-center justify-between">
                    <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Contrast className="w-5 h-5 mr-2" aria-hidden="true" />
                      High Contrast Mode
                    </span>
                    <button
                      role="switch"
                      aria-checked={config.highContrast}
                      onClick={() => handleChange('highContrast', !config.highContrast)}
                      className={`${
                        config.highContrast ? 'bg-blue-600' : 'bg-gray-300'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          config.highContrast ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Increase color contrast for better visibility
                  </p>
                </div>

                {/* Reduced Motion */}
                <div>
                  <label className="flex items-center justify-between">
                    <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Zap className="w-5 h-5 mr-2" aria-hidden="true" />
                      Reduce Motion
                    </span>
                    <button
                      role="switch"
                      aria-checked={config.reducedMotion}
                      onClick={() => handleChange('reducedMotion', !config.reducedMotion)}
                      className={`${
                        config.reducedMotion ? 'bg-blue-600' : 'bg-gray-300'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          config.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimize animations and transitions
                  </p>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <label className="flex items-center justify-between">
                    <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Keyboard className="w-5 h-5 mr-2" aria-hidden="true" />
                      Keyboard Shortcuts
                    </span>
                    <button
                      role="switch"
                      aria-checked={config.enableKeyboardShortcuts}
                      onClick={() =>
                        handleChange('enableKeyboardShortcuts', !config.enableKeyboardShortcuts)
                      }
                      className={`${
                        config.enableKeyboardShortcuts ? 'bg-blue-600' : 'bg-gray-300'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          config.enableKeyboardShortcuts ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enable keyboard navigation shortcuts
                  </p>
                  {config.enableKeyboardShortcuts && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Available Shortcuts {platform !== 'unknown' && (
                          <span className="ml-1 text-blue-700 dark:text-blue-300">
                            ({platform === 'mac' || platform === 'ios' ? 'macOS/iOS' :
                              platform === 'windows' ? 'Windows' :
                              platform === 'linux' ? 'Linux' :
                              platform === 'android' ? 'Android' : ''})
                          </span>
                        )}:
                      </p>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        {(platform === 'mac' || platform === 'ios') ? (
                          <>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Cmd+H</kbd> - Home</li>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Cmd+D</kbd> - Dashboard</li>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Cmd+S</kbd> - Search</li>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Cmd+M</kbd> - Skip to main content</li>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Cmd+/</kbd> - Show all shortcuts</li>
                          </>
                        ) : (
                          <>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Alt+H</kbd> - Home</li>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Alt+D</kbd> - Dashboard</li>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Alt+S</kbd> - Search</li>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Alt+M</kbd> - Skip to main content</li>
                            <li><kbd className="px-1 bg-white dark:bg-gray-800 rounded">Alt+/</kbd> - Show all shortcuts</li>
                          </>
                        )}
                        <li className="pt-1 border-t border-blue-200 dark:border-blue-800 mt-2">
                          <kbd className="px-1 bg-white dark:bg-gray-800 rounded">Tab</kbd> - Navigate between elements
                        </li>
                        <li>
                          <kbd className="px-1 bg-white dark:bg-gray-800 rounded">Enter</kbd> / <kbd className="px-1 bg-white dark:bg-gray-800 rounded">Space</kbd> - Activate
                        </li>
                        <li>
                          <kbd className="px-1 bg-white dark:bg-gray-800 rounded">Esc</kbd> - Close dialogs/modals
                        </li>
                        {(platform === 'android' || platform === 'ios') && (
                          <>
                            <li className="pt-1 border-t border-blue-200 dark:border-blue-800 mt-2">
                              <strong>Mobile Gestures:</strong>
                            </li>
                            <li>• Swipe with 2 fingers to scroll</li>
                            <li>• Double tap to activate</li>
                            <li>• Volume keys to navigate (if enabled)</li>
                          </>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Page Change Announcements */}
                <div>
                  <label className="flex items-center justify-between">
                    <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Volume2 className="w-5 h-5 mr-2" aria-hidden="true" />
                      Announce Page Changes
                    </span>
                    <button
                      role="switch"
                      aria-checked={config.announcePageChanges}
                      onClick={() => handleChange('announcePageChanges', !config.announcePageChanges)}
                      className={`${
                        config.announcePageChanges ? 'bg-blue-600' : 'bg-gray-300'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          config.announcePageChanges ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Screen reader announces page navigation
                  </p>
                </div>

                {/* Screen Reader Mode */}
                <div>
                  <label className="flex items-center justify-between">
                    <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Eye className="w-5 h-5 mr-2" aria-hidden="true" />
                      Screen Reader Optimization
                    </span>
                    <button
                      role="switch"
                      aria-checked={config.screenReaderMode}
                      onClick={() => handleChange('screenReaderMode', !config.screenReaderMode)}
                      className={`${
                        config.screenReaderMode ? 'bg-blue-600' : 'bg-gray-300'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          config.screenReaderMode ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enhanced support for screen readers
                  </p>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    updateConfig({
                      fontSize: 'medium',
                      highContrast: false,
                      reducedMotion: false,
                      enableKeyboardShortcuts: true,
                      announcePageChanges: true,
                      screenReaderMode: false,
                    });
                    announce('Accessibility settings reset to default', 'polite');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Reset to Default
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  About Accessibility
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  FarmCon is committed to accessibility for all users. These settings help customize
                  your experience based on your needs. We follow WCAG 2.1 AA guidelines.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
